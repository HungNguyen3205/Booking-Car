<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseApiRequest;
use Illuminate\Validation\Rule;

class AdminUpdateRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'id' => [
                'required',
                'integer',
                'exists:admins,id',
            ],
            'ho_ten' => [
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('admins', 'email')->ignore($this->id),
            ],
            'password' => [
                'nullable',
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
            'id.required'            => 'Mã định danh quản trị viên là bắt buộc!',
            'id.exists'              => 'Quản trị viên không tồn tại trong hệ thống!',
            'ho_ten.required'        => 'Họ tên quản trị viên là bắt buộc!',
            'email.required'         => 'Email là bắt buộc!',
            'email.email'            => 'Định dạng email không hợp lệ!',
            'email.unique'           => 'Email này đã được sử dụng bởi quản trị viên khác!',
            'password.min'           => 'Mật khẩu phải có ít nhất 6 ký tự!',
            'so_dien_thoai.required' => 'Số điện thoại là bắt buộc!',
            'so_dien_thoai.regex'    => 'Số điện thoại phải là định dạng hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84)!',
            'tinh_trang.in'          => 'Trạng thái tài khoản không hợp lệ (0: Khóa, 1: Hoạt động)!',
        ];
    }
}
