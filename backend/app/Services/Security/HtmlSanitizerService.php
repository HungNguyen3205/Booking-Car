<?php

namespace App\Services\Security;

use DOMDocument;
use DOMElement;
use DOMNode;

class HtmlSanitizerService
{
    /**
     * Danh sách thẻ HTML được phép trong nội dung bài viết
     */
    protected static array $allowedTags = [
        'p', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'mark', 'small', 'sub', 'sup',
        'blockquote', 'pre', 'code',
        'ul', 'ol', 'li',
        'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
        'iframe',
    ];

    /**
     * Danh sách thẻ độc hại bị loại bỏ cả thẻ lẫn toàn bộ nội dung con
     */
    protected static array $dangerousTags = [
        'script', 'style', 'object', 'embed', 'applet', 'svg', 'math',
        'form', 'input', 'button', 'select', 'textarea', 'option',
        'frame', 'frameset', 'base', 'meta', 'link', 'template',
    ];

    /**
     * Thuộc tính toàn cục an toàn được phép
     */
    protected static array $globalAllowedAttributes = [
        'class', 'id', 'title', 'dir', 'lang', 'style',
    ];

    /**
     * Thuộc tính được phép theo từng thẻ cụ thể
     */
    protected static array $tagAllowedAttributes = [
        'a'      => ['href', 'target', 'rel', 'title', 'class', 'id'],
        'img'    => ['src', 'alt', 'title', 'width', 'height', 'loading', 'class', 'id', 'style'],
        'iframe' => ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title', 'class', 'loading'],
        'table'  => ['class', 'id', 'style', 'border', 'cellpadding', 'cellspacing', 'width'],
        'th'     => ['colspan', 'rowspan', 'align', 'valign', 'class', 'id', 'style', 'width'],
        'td'     => ['colspan', 'rowspan', 'align', 'valign', 'class', 'id', 'style', 'width'],
    ];

    /**
     * Làm sạch mã HTML theo mô hình Allowlist nghiêm ngặt
     */
    public static function clean(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $doc = new DOMDocument();
        libxml_use_internal_errors(true);

        // Bọc HTML với encoding UTF-8 để bảo toàn ký tự tiếng Việt
        $wrapper = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>' . $html . '</body></html>';
        $doc->loadHTML($wrapper, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $body = $doc->getElementsByTagName('body')->item(0);
        if (!$body) {
            return '';
        }

        // Làm sạch từng node trong cây DOM
        self::sanitizeNode($body);

        // Xuất HTML sau khi đã làm sạch
        $output = '';
        foreach ($body->childNodes as $child) {
            $output .= $doc->saveHTML($child);
        }

        return trim($output);
    }

    /**
     * Đệ quy duyệt và làm sạch từng node
     */
    protected static function sanitizeNode(DOMNode $node): void
    {
        $childNodes = [];
        foreach ($node->childNodes as $child) {
            $childNodes[] = $child;
        }

        foreach ($childNodes as $child) {
            if ($child->nodeType === XML_ELEMENT_NODE) {
                $tagName = strtolower($child->nodeName);

                // 1. Nếu là thẻ nguy hiểm (script, style, object,...): Xóa bỏ hoàn toàn cả thẻ lẫn con
                if (in_array($tagName, self::$dangerousTags, true)) {
                    $node->removeChild($child);
                    continue;
                }

                // 2. Nếu thẻ không nằm trong danh sách thẻ được phép:
                // Giữ lại nội dung con nhưng loại bỏ thẻ bao bọc (unwrap)
                if (!in_array($tagName, self::$allowedTags, true)) {
                    self::unwrapNode($child);
                    continue;
                }

                // 3. Xử lý quy tắc riêng cho thẻ <iframe>
                if ($tagName === 'iframe') {
                    if (!self::isSafeIframe($child)) {
                        $node->removeChild($child);
                        continue;
                    }
                }

                // 4. Làm sạch thuộc tính của thẻ
                self::sanitizeAttributes($child);

                // 5. Đệ quy tiếp các phần tử con
                self::sanitizeNode($child);
            }
        }
    }

    /**
     * Loại bỏ thẻ nhưng giữ lại nội dung con bên trong
     */
    protected static function unwrapNode(DOMElement $element): void
    {
        $parent = $element->parentNode;
        if (!$parent) {
            return;
        }

        while ($element->hasChildNodes()) {
            $child = $element->firstChild;
            $element->removeChild($child);
            $parent->insertBefore($child, $element);
        }

        $parent->removeChild($element);
    }

    /**
     * Kiểm tra tính an toàn của thẻ <iframe> (Chỉ cho phép Youtube, Vimeo, Google Maps)
     */
    protected static function isSafeIframe(DOMElement $iframe): bool
    {
        $src = trim($iframe->getAttribute('src'));
        if (empty($src)) {
            return false;
        }

        $parts = parse_url($src);
        if (!$parts || empty($parts['host'])) {
            return false;
        }

        $scheme = strtolower($parts['scheme'] ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower($parts['host']);
        $path = $parts['path'] ?? '';

        // YouTube Embeds
        if (in_array($host, ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'], true)) {
            return str_starts_with($path, '/embed/');
        }

        // Vimeo Embeds
        if (in_array($host, ['player.vimeo.com', 'vimeo.com'], true)) {
            return str_starts_with($path, '/video/');
        }

        // Google Maps Embeds
        if (in_array($host, ['google.com', 'www.google.com', 'maps.google.com'], true)) {
            return str_starts_with($path, '/maps/embed') || str_starts_with($path, '/maps');
        }

        return false;
    }

    /**
     * Làm sạch các thuộc tính của một phần tử HTML
     */
    protected static function sanitizeAttributes(DOMElement $element): void
    {
        $tagName = strtolower($element->nodeName);
        $allowedAttrs = array_merge(
            self::$globalAllowedAttributes,
            self::$tagAllowedAttributes[$tagName] ?? []
        );

        $attrsToRemove = [];

        foreach ($element->attributes as $attr) {
            $name = strtolower($attr->name);
            $val = trim($attr->value);

            // Chặn toàn bộ inline event handlers (onload, onerror, onclick, onmouseover, v.v.)
            if (str_starts_with($name, 'on')) {
                $attrsToRemove[] = $attr->name;
                continue;
            }

            // Chặn thuộc tính không nằm trong danh sách cho phép
            if (!in_array($name, $allowedAttrs, true)) {
                $attrsToRemove[] = $attr->name;
                continue;
            }

            // Kiểm tra thuộc tính href của thẻ <a>
            if ($tagName === 'a' && $name === 'href') {
                if (!self::isSafeUrl($val)) {
                    $attrsToRemove[] = $attr->name;
                    continue;
                }
            }

            // Kiểm tra thuộc tính src của thẻ <img>
            if ($tagName === 'img' && $name === 'src') {
                if (!self::isSafeImageUrl($val)) {
                    $attrsToRemove[] = $attr->name;
                    continue;
                }
            }

            // Kiểm tra thuộc tính style để chặn expression, javascript, behavior
            if ($name === 'style') {
                if (preg_match('/(expression|javascript|behavior|vbscript|url\s*\(|-moz-binding|@import)/i', $val)) {
                    $attrsToRemove[] = $attr->name;
                    continue;
                }
            }
        }

        // Gỡ bỏ các thuộc tính không hợp lệ
        foreach ($attrsToRemove as $attrName) {
            $element->removeAttribute($attrName);
        }

        // Đảm bảo thẻ <a> có target="_blank" luôn đi kèm rel="noopener noreferrer"
        if ($tagName === 'a' && strtolower($element->getAttribute('target')) === '_blank') {
            $rel = strtolower($element->getAttribute('rel'));
            if (!str_contains($rel, 'noopener') || !str_contains($rel, 'noreferrer')) {
                $element->setAttribute('rel', 'noopener noreferrer');
            }
        }
    }

    /**
     * Kiểm tra URL an toàn cho thẻ liên kết (chặn javascript:, data:, vbscript:)
     */
    protected static function isSafeUrl(string $url): bool
    {
        $url = trim($url);

        // Cho phép đường dẫn tương đối hoặc neo (#, /, ?)
        if (str_starts_with($url, '/') || str_starts_with($url, '#') || str_starts_with($url, '?')) {
            return true;
        }

        // Chặn nguy cơ tấn công qua URL protocol
        if (preg_match('/^\s*(javascript|data|vbscript|file):/i', $url)) {
            return false;
        }

        $parts = parse_url($url);
        if (!$parts || empty($parts['scheme'])) {
            return false;
        }

        $scheme = strtolower($parts['scheme']);
        return in_array($scheme, ['http', 'https', 'mailto', 'tel'], true);
    }

    /**
     * Kiểm tra URL hình ảnh an toàn
     */
    protected static function isSafeImageUrl(string $url): bool
    {
        $url = trim($url);

        if (str_starts_with($url, '/')) {
            return true;
        }

        if (preg_match('/^\s*(javascript|data|vbscript|file):/i', $url)) {
            return false;
        }

        $parts = parse_url($url);
        if (!$parts || empty($parts['scheme'])) {
            return false;
        }

        $scheme = strtolower($parts['scheme']);
        return in_array($scheme, ['http', 'https'], true);
    }
}
