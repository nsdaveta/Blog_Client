import React, { useRef } from 'react';

const OtpInput = ({ value, onChange }) => {
    const inputRefs = useRef([]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = value.split('');
        newOtp[index] = val;
        onChange(newOtp.join(''));

        // Move to next input if not empty
        if (val && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
            const newOtp = value.split('');
            newOtp[index] = '';
            onChange(newOtp.join(''));
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
        onChange(pastedData);
        if (pastedData.length === 6) {
            inputRefs.current[5].focus();
        }
    };

    return (
        <div className="otp-container">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    className="otp-input"
                    required
                />
            ))}
        </div>
    );
};

export default OtpInput;
