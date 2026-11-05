<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseApiRequest;

class PromoteUserRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'role' => [
                'nullable',
                'string',
                'in:owner,dispatcher,accountant',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'id.required' => 'Mã định danh người dùng là bắt buộc!',
            'id.integer'  => 'Mã định danh người dùng phải là số nguyên!',
            'id.exists'   => 'Người dùng cần nâng cấp không tồn tại trong hệ thống!',
        ];
    }
}
