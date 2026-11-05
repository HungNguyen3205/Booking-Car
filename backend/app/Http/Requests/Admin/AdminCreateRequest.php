<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseApiRequest;

class AdminCreateRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'ho_ten' => [
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:admins,email',
            ],
            'password' => [
                'required',
                'string',
                'min:6',
                'max:100',
            ],
            'so_dien_thoai' => [
                'required',
                'string',
                'regex:/^(0|\+84)[0-9]{9,10}$/',
            ],
            'dia_chi' => [
                'nullable',
                'string',
                'max:255',
            ],
            'role' => [
                'nullable',
                'string',
                'in:owner,dispatcher,accountant',
            ],
            'permissions' => [
                'nullable',
                'array',
            ],
            'permissions.*' => [
                'string',
            ],
            'tinh_trang' => [
                'nullable',
                'integer',
                'in:0,1',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required'        => 'Họ tên quản trị viên là bắt buộc!',
            'email.required'         => 'Email là bắt buộc!',
            'email.email'            => 'Định dạng email không hợp lệ!',
            'email.unique'           => 'Email quản trị viên này đã tồn tại trong hệ thống!',
            'password.required'      => 'Mật khẩu là bắt buộc!',
            'password.min'           => 'Mật khẩu phải có ít nhất 6 ký tự!',
            'so_dien_thoai.required' => 'Số điện thoại là bắt buộc!',
            'so_dien_thoai.regex'    => 'Số điện thoại phải là định dạng hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84)!',
            'tinh_trang.in'          => 'Trạng thái tài khoản không hợp lệ (0: Khóa, 1: Hoạt động)!',
        ];
    }
}
