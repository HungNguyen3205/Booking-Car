<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseApiRequest extends FormRequest
{
    /**
     * Mặc định cho phép các request API đã qua guard
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Tùy biến trả về phản hồi lỗi validation HTTP 422 chuẩn hóa
     * Cấu trúc JSON thống nhất: { status: 0, message: string, errors: array }
     */
    protected function failedValidation(Validator $validator)
    {
        $errors = $validator->errors()->toArray();
        $firstError = $validator->errors()->first();

        throw new HttpResponseException(response()->json([
            'status'  => 0,
            'message' => $firstError ?: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!',
            'errors'  => $errors,
        ], 422));
    }
}
