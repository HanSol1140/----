import RPi.GPIO as GPIO
import bluetooth
import datetime

button_pins = [22, 25, 27]

def setup():
    # GPIO 설정
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(button_pins, GPIO.IN, pull_up_down=GPIO.PUD_UP)


if __name__ == '__main__':
    setup()

# 장치의 마지막 검색 시간을 저장하는 사전
last_seen = {}
while True:
    # print("Searching for Bluetooth devices...")

    nearby_devices = bluetooth.discover_devices(duration=2, lookup_names=True)

    # print("Found {} devices.".format(len(nearby_devices)))

    for addr, name in nearby_devices:
        # 장치가 마지막으로 검색된 시간을 가져옵니다.
        last_time = last_seen.get(addr)

        # 장치가 마지막으로 검색된 지 10초 이상이면 장치 정보를 출력합니다.
        if last_time is None or (datetime.datetime.now() - last_time).total_seconds() > 10:
            print(addr)
            # print("  %s - %s" % (addr, name))

            # 장치의 마지막 검색 시간을 갱신합니다.
            last_seen[addr] = datetime.datetime.now()



print("python on")
# import bluetooth

# while True:
#     # print("Searching for Bluetooth devices...")

#     nearby_devices = bluetooth.discover_devices(duration=2, lookup_names=True)

#     # print("Found {} devices.".format(len(nearby_devices)))

#     for addr, name in nearby_devices:
#         # print("  %s - %s" % (addr, name))
#         print(addr)
