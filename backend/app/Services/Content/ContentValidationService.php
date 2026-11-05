<?php

namespace App\Services\Content;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ContentValidationService
{
    /**
     * Danh sách 8 khối nội dung được phép quản lý
     */
    public const ALLOWED_SECTIONS = [
        'home_hero',
        'home_rental_steps',
        'home_bento',
        'home_faq',
        'about_page',
        'contact_page',
        'process_page',
        'policies_page',
    ];

    /**
     * Danh sách các từ khóa cấm nhằm ngăn chặn editor can thiệp công thức giá hoặc trạng thái booking
     */
    protected const FORBIDDEN_KEYS = [
        'pricing_formula',
        'price_per_day',
        'gia_thue',
        'discount_rate',
        'vat_rate',
        'booking_status',
        'trang_thai',
        'deposit_amount',
        'car_specs',
        'battery_capacity',
    ];

    /**
     * Kiểm tra URL CTA an toàn (bắt đầu bằng / hoặc http/https, không chứa javascript: hoặc mã độc)
     */
    public static function isValidCtaUrl(?string $url): bool
    {
        if ($url === null || $url === '') {
            return true;
        }

        $trimmed = trim($url);

        // Chống tuyệt đối giao thức javascript, data, vbscript hoặc html tag
        if (preg_match('/^(javascript|data|vbscript|file):/i', $trimmed)) {
            return false;
        }

        if (str_contains(strtolower($trimmed), '<') || str_contains(strtolower($trimmed), '>') || str_contains(strtolower($trimmed), '"')) {
            return false;
        }

        // Bắt buộc phải là đường dẫn nội bộ (/...) hoặc URL tuyệt đối http://, https://
        return (bool) preg_match('/^(\/[a-zA-Z0-9_\-.~%!$&\'()*+,;=:@\/?#]*|https?:\/\/[a-zA-Z0-9\-._~:?#\[\]@!$&\'()*+,;=]+)$/i', $trimmed);
    }

    /**
     * Kiểm tra nội dung chuỗi có chứa thẻ html nguy hại hay script tùy ý không
     */
    public static function containsMaliciousPayload(string $value): bool
    {
        $lowered = strtolower($value);
        if (str_contains($lowered, '<script') || str_contains($lowered, 'javascript:') || str_contains($lowered, 'onerror=') || str_contains($lowered, 'onload=')) {
            return true;
        }
        return false;
    }

    /**
     * Đệ quy kiểm tra payload
     */
    public static function recursivelyInspect(array $data): void
    {
        foreach ($data as $key => $val) {
            // Không cho phép các khóa cấm liên quan giá & booking
            if (in_array(strtolower((string)$key), self::FORBIDDEN_KEYS, true)) {
                throw ValidationException::withMessages([
                    $key => ["Hệ thống không cho phép cấu hình giá xe, công thức giá hoặc trạng thái đặt xe trong CMS."],
                ]);
            }

            if (is_array($val)) {
                self::recursivelyInspect($val);
            } elseif (is_string($val)) {
                if (self::containsMaliciousPayload($val)) {
                    throw ValidationException::withMessages([
                        $key => ["Trường dữ liệu {$key} chứa thẻ hoặc đoạn mã không được phép."],
                    ]);
                }
            }
        }
    }

    /**
     * Validate dữ liệu schema theo từng section
     *
     * @throws ValidationException
     */
    public function validateSectionContent(string $sectionKey, array $content): array
    {
        if (!in_array($sectionKey, self::ALLOWED_SECTIONS, true)) {
            throw ValidationException::withMessages([
                'section_key' => ["Khối nội dung [{$sectionKey}] không nằm trong danh mục hỗ trợ."],
            ]);
        }

        // Kiểm tra an toàn bảo mật và từ khóa cấm
        self::recursivelyInspect($content);

        // Lấy rules cụ thể theo section
        $rules = $this->getRulesForSection($sectionKey);

        $validator = Validator::make($content, $rules, [
            'required' => 'Trường :attribute không được bỏ trống.',
            'max'      => 'Trường :attribute không được vượt quá :max ký tự.',
            'array'    => 'Trường :attribute phải là một danh sách hợp lệ.',
        ]);

        // Thêm custom validation cho CTA URL
        $validator->after(function ($v) use ($sectionKey, $content) {
            $this->validateCustomCtaUrls($sectionKey, $content, $v);
        });

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Custom validation cho CTA URLs
     */
    protected function validateCustomCtaUrls(string $sectionKey, array $content, $validator): void
    {
        $checkCta = function (string $field, ?string $url) use ($validator) {
            if ($url !== null && !self::isValidCtaUrl($url)) {
                $validator->errors()->add($field, "Đường dẫn CTA [{$field}] không hợp lệ. Chỉ chấp nhận đường dẫn bắt đầu bằng '/' hoặc 'http/https'.");
            }
        };

        if ($sectionKey === 'home_hero') {
            $checkCta('secondary_cta_url', $content['secondary_cta_url'] ?? null);
        } elseif ($sectionKey === 'home_bento') {
            $checkCta('card_policy_cta_url', $content['card_policy_cta_url'] ?? null);
        } elseif ($sectionKey === 'process_page') {
            $checkCta('primary_cta_url', $content['primary_cta_url'] ?? null);
            $checkCta('secondary_cta_url', $content['secondary_cta_url'] ?? null);
        }
    }

    /**
     * Lấy schema rules cho từng section
     */
    protected function getRulesForSection(string $sectionKey): array
    {
        return match ($sectionKey) {
            'home_hero' => [
                'eyebrow'            => 'required|string|max:120',
                'title'              => 'required|string|max:200',
                'description'        => 'required|string|max:500',
                'primary_cta_text'   => 'required|string|max:80',
                'primary_cta_action' => 'nullable|string|max:80',
                'secondary_cta_text' => 'required|string|max:80',
                'secondary_cta_url'  => 'required|string|max:255',
                'visual_note'        => 'nullable|string|max:120',
            ],
            'home_rental_steps' => [
                'eyebrow'              => 'required|string|max:120',
                'title'                => 'required|string|max:200',
                'description'          => 'required|string|max:500',
                'steps'                => 'required|array|min:2|max:6',
                'steps.*.step_number'  => 'required|string|max:10',
                'steps.*.icon'         => 'required|string|max:80',
                'steps.*.title'        => 'required|string|max:120',
                'steps.*.desc'         => 'required|string|max:500',
            ],
            'home_bento' => [
                'eyebrow'              => 'required|string|max:120',
                'title'                => 'required|string|max:200',
                'featured_badge'       => 'required|string|max:80',
                'featured_title'       => 'required|string|max:200',
                'featured_desc'        => 'required|string|max:600',
                'featured_image'       => 'required|string|max:500',
                'featured_features'    => 'required|array|min:1|max:6',
                'featured_features.*'  => 'required|string|max:120',
                'card_network_badge'   => 'required|string|max:80',
                'card_network_title'   => 'required|string|max:200',
                'card_network_desc'    => 'required|string|max:600',
                'card_policy_badge'    => 'required|string|max:80',
                'card_policy_title'    => 'required|string|max:200',
                'card_policy_desc'     => 'required|string|max:600',
                'card_policy_cta_text' => 'required|string|max:80',
                'card_policy_cta_url'  => 'required|string|max:255',
            ],
            'home_faq' => [
                'eyebrow'          => 'required|string|max:120',
                'title'            => 'required|string|max:200',
                'description'      => 'required|string|max:500',
                'faqs'             => 'required|array|min:1|max:20',
                'faqs.*.question'  => 'required|string|max:255',
                'faqs.*.answer'    => 'required|string|max:2000',
            ],
            'about_page' => [
                'badge'                 => 'required|string|max:80',
                'title'                 => 'required|string|max:200',
                'hero_desc'             => 'required|string|max:600',
                'mission_title'         => 'required|string|max:200',
                'mission_paragraph_1'   => 'required|string|max:1200',
                'mission_paragraph_2'   => 'required|string|max:1200',
                'commitments'           => 'required|array|min:1|max:10',
                'commitments.*.icon'    => 'required|string|max:80',
                'commitments.*.title'   => 'required|string|max:120',
                'commitments.*.desc'    => 'required|string|max:600',
                'team_image'            => 'required|string|max:500',
            ],
            'contact_page' => [
                'badge'          => 'required|string|max:80',
                'title'          => 'required|string|max:200',
                'hero_desc'      => 'required|string|max:600',
                'form_title'     => 'required|string|max:200',
                'form_subtitle'  => 'required|string|max:600',
                'sidebar_title'  => 'required|string|max:200',
                'sidebar_sub'    => 'required|string|max:600',
                'ai_badge'       => 'required|string|max:80',
                'ai_title'       => 'required|string|max:200',
                'ai_desc'        => 'required|string|max:600',
            ],
            'process_page' => [
                'badge'               => 'required|string|max:80',
                'title'               => 'required|string|max:200',
                'hero_desc'           => 'required|string|max:600',
                'steps'               => 'required|array|min:1|max:10',
                'steps.*.step_number' => 'required|string|max:10',
                'steps.*.icon'        => 'required|string|max:80',
                'steps.*.title'       => 'required|string|max:120',
                'steps.*.desc'        => 'required|string|max:600',
                'cta_title'           => 'required|string|max:200',
                'cta_desc'            => 'required|string|max:600',
                'primary_cta_text'    => 'required|string|max:80',
                'primary_cta_url'     => 'required|string|max:255',
                'secondary_cta_text'  => 'required|string|max:80',
                'secondary_cta_url'   => 'required|string|max:255',
            ],
            'policies_page' => [
                'badge'               => 'required|string|max:80',
                'title'               => 'required|string|max:200',
                'intro'               => 'required|string|max:1200',
                'sections'            => 'required|array|min:1|max:20',
                'sections.*.title'    => 'required|string|max:255',
                'sections.*.content'  => 'required|string|max:3000',
            ],
            default => [],
        };
    }
}
