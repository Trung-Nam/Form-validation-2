function Validator(formSelector, options) {
    // Gán giá trị mặc định cho tham số khi định nghĩa (5)
    if (!options) {
        options = {};
    }
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    var formRules = {};
    /**
     * Quy ước tạo rule"
     * - Nếu lỗi thì return `error message`
     * - Nếu không có lỗi thì return `undefined`
     */
    var validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Vui lòng nhập email'
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} ký tự`;
            }
        },
        max: function (max) {
            return function (value) {
                return value.length <= max ? undefined : `Tối đa ${max} ký tự`;
            }
        }
    };
    // Lấy ra form element trong DOM theo 'formSelector'
    var formElement = document.querySelector(formSelector);

    // chỉ sử lý khi có element trong DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]');

        for (var input of inputs) {

            var rules = input.getAttribute('rules').split('|');
            for (var rule of rules) {
                var ruInfo;
                var isRuleHasValue = rule.includes(':');

                if (isRuleHasValue) {
                    ruInfo = rule.split(':');
                    rule = ruInfo[0];
                }


                var ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate(blur, change)

            input.onblur = handleValidate;
            input.oninput = handleClearError;

        }
        //Hàm thực hiện validate 
        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;
            rules.find(function (rule) {
                errorMessage = rule(event.target.value);
                return errorMessage;
            });

            // Nếu có lỗi thì hiển thị message lỗi ra UI

            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group');
                if (formGroup) {
                    formGroup.classList.add('invalid');

                    var formMessage = formGroup.querySelector('.form-message');
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }
            // console.log(errorMessage);
            return !errorMessage;
        }
        // Hàm clear message error
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group');

            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');

                var formMessage = formGroup.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }

        // Xử lý hành vi submit form 
        formElement.onsubmit = function (event) {
            event.preventDefault();

            var inputs = formElement.querySelectorAll('[name][rules]');
            var isValid = true;
            for (var input of inputs) {
                if (!handleValidate({ target: input })) {
                    isValid = false;
                }
            }
            // console.log(isValid);

            // Khi không có lỗi thì submit form 
            this.onSubmit = function () {

            };
            if (isValid) {

                if (typeof options.onSubmit === 'function') {

                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    console.log(enableInputs);
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                                break;
                        }

                        return values;
                    }, {});
                    // Gọi lại hàm onsubmit và trả về giá trị của form
                    options.onSubmit(formValues);
                } else {
                    formElement.submit();
                }
            }
        }


    }
}