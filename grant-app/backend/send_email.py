import smtplib
import sys

def send_email(to_email, otp):
    try:
        # Create an SMTP session
        s = smtplib.SMTP('smtp.gmail.com', 587)
        s.starttls()  # Start TLS for security

        # Login to your email account
        s.login("grantofficervu@gmail.com", "zqkx peym yblm wokj")  # Use app password if using 2FA

        # Prepare the message
        message = f"""From: Grant Officer <grantofficervu@gmail.com>
To: {to_email}
Subject: Your OTP Code

Your OTP code is: {otp}
"""

        # Send the email
        s.sendmail("grantofficervu@gmail.com", to_email, message)

    except smtplib.SMTPAuthenticationError:
        print("Authentication error: Check your email and password or app password.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        s.quit()  # Close the SMTP session

# Accept command line arguments
if __name__ == "__main__":
    to_email = sys.argv[1]
    otp = sys.argv[2]
    send_email(to_email, otp)
