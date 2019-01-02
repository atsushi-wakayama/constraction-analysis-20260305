from apscheduler.schedulers.blocking import BlockingScheduler
import words

twische = BlockingScheduler()

@twische.scheduled_job('interval',minutes=1440)
def timed_job():
    words.puttweet()

if __name__ == "__main__":
    twische.start()
  
