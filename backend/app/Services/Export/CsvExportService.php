<?php

namespace App\Services\Export;

use Symfony\Component\HttpFoundation\StreamedResponse;

class CsvExportService
{
    /**
     * Ký tự Byte Order Mark (BOM) UTF-8 để Microsoft Excel và các phần mềm bảng tính
     * tự động nhận diện đúng bảng mã tiếng Việt có dấu mà không bị lỗi font (mojibake).
     */
    public const UTF8_BOM = "\xEF\xBB\xBF";

    /**
     * Danh sách các ký tự nguy hiểm có thể kích hoạt Spreadsheet Formula Injection (CSV Injection).
     * Khi một ô bắt đầu bằng các ký tự này, Excel/Calc có thể thực thi lệnh hoặc công thức nguy hiểm.
     */
    protected const FORMULA_PREFIXES = ['=', '+', '-', '@', "\t", "\r"];

    /**
     * Chống CSV / Spreadsheet Formula Injection với dữ liệu do người dùng nhập.
     * Nếu giá trị bắt đầu bằng =, +, -, @, tab hoặc cr, tự động thêm dấu nháy đơn ' ở đầu.
     *
     * @param mixed $value
     * @return string
     */
    public static function sanitizeForCsv($value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? 'Có' : 'Không';
        }

        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        $str = (string) $value;
        if ($str === '') {
            return '';
        }

        // Kiểm tra ký tự đầu tiên
        $firstChar = $str[0];
        if (in_array($firstChar, self::FORMULA_PREFIXES, true)) {
            // Prepend dấu nháy đơn để bảng tính hiển thị dưới dạng chuỗi văn bản thuần
            return "'" . $str;
        }

        return $str;
    }

    /**
     * Tạo HTTP StreamedResponse tải file CSV UTF-8 theo lô (chunk), không tốn RAM.
     *
     * @param string $filename Tên file tải về (ví dụ: danh_sach_don_dat_xe.csv)
     * @param array $headers Mảng tiêu đề cột tiếng Việt
     * @param callable $rowGenerator Callback nhận con trỏ file $stream để ghi từng dòng
     * @return StreamedResponse
     */
    public static function streamDownload(string $filename, array $headers, callable $rowGenerator): StreamedResponse
    {
        $responseHeaders = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ];

        return response()->streamDownload(function () use ($headers, $rowGenerator) {
            $stream = fopen('php://output', 'w');

            // 1. Ghi UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
            fwrite($stream, self::UTF8_BOM);

            // 2. Ghi dòng tiêu đề
            fputcsv($stream, $headers);

            // 3. Thực thi generator ghi các dòng dữ liệu theo lô
            $rowGenerator($stream);

            fclose($stream);
        }, $filename, $responseHeaders);
    }
}
