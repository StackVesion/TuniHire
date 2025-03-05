const VerificationMessage = ({ email }) => {
    return (
        <div className="verification-message alert alert-success text-center">
            <div className="icon-wrapper mb-3">
                <div className="verification-icon">✉️</div>
            </div>
            <h4>Verify Your Email</h4>
            <p>
                We've sent a verification link to<br/>
                <strong>{email}</strong>
            </p>
            <p className="small">
                Please check your inbox and spam folder.<br/>
                The link will expire in 24 hours.
            </p>
        </div>
    );
};

export default VerificationMessage;
