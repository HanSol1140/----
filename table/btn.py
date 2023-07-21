import RPi.GPIO as GPIO

button_pins = [17, 27, 22, 23, 24, 5, 6]

def setup():
    # GPIO 설정
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(button_pins, GPIO.IN, pull_up_down=GPIO.PUD_UP)

if __name__ == '__main__':
    setup()
