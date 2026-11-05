<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseApiRequest;

class AdminActionIdRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'id' => [
                'required',
                'integer',
                'exists:admins,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'id.required' => 'Mã định danh quản trị viên là bắt buộc!',
            'id.integer'  => 'Mã định danh quản trị viên phải là số nguyên!',
            'id.exists'   => 'Quản trị viên không tồn tại trong hệ thống!',
        ];
    }
}
