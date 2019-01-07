#!/usr/bin/env python
# coding: utf-8

# In[1]:


import tweepy
import requests
import datetime
import random


# In[2]:


url = "https://api.darksky.net/forecast/7cefa5e6ef956bf1d81c5c2f827b7021/35.708162, 139.736018?units=si&lang=ja"
data = requests.get(url).json()


# In[3]:


date = data['daily']['data'][1]['time']
high_temp_celsius = data['daily']['data'][1]['temperatureMax']
low_temp_celsius = data['daily']['data'][1]['temperatureMin']
weather = data['daily']['data'][1]['icon']
summary = data['daily']['data'][1]['summary']


# In[4]:


date = str(datetime.datetime.fromtimestamp(date))
print(date)


# In[5]:


tstr = date
tdatetime = datetime.datetime.strptime(tstr, '%Y-%m-%d %H:%M:%S')
tdate = datetime.date(tdatetime.year, tdatetime.month, tdatetime.day)
tyear = str(tdate.year)
tmonth = str(tdate.month)
tday = str(tdate.day)
print(tyear)
print(tmonth)
print(tday)


# In[6]:


print(high_temp_celsius)
print(low_temp_celsius)


# In[7]:


high_temp_celsius_round = round(high_temp_celsius, 1)
low_temp_celsius_round = round(low_temp_celsius, 1)


# In[8]:


high_temp_celsius_round = str(high_temp_celsius_round)
low_temp_celsius_round = str(low_temp_celsius_round)
print(high_temp_celsius_round)
print(low_temp_celsius_round)


# In[9]:


a = weather
if "rain" in a:
    a = "雨"
    print(a)
else:
    print(a)


# In[10]:


if "partly-cloudy" in a:
    a = "くもり時々晴れ"
    print(a)
else:
    print(a)


# In[11]:


if "clear-day" in a:
    a = "晴れ"
    print(a)
else:
    print(a)


# In[12]:


if "cloudy" in a:
    a = "くもり"
    print(a)
else:
    print(a)


# In[13]:


if "snow" in a:
    a = "雪"
    print(a)
else:
    print(a)


# In[14]:


if "wind" in a:
    a = "強風"
    print(a)
else:
    print(a)


# In[15]:


summary = str(summary)


# In[16]:


l = ["pta","ptb","ptc","ptd","pte"]
pattern=random.choice(l)
print(pattern)


# In[18]:


if pattern == "pta":
    message = "こんばんは…佐々木千枝です。ブルナポ天気予報が明日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。"+summary[:-1]+"になるみたいです。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です…\n…プロデューサーさん、ゆっくり休んでくださいね。#ブルナポ応援企画 #ブルナポ夜の天気予報"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc4.jpg'
else:
    print(pattern)


# In[24]:


if pattern == "ptb":
    message = "荒木比奈が明日の天気予報をお伝えするっス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！"+summary[:-1]+"になりそうっスねぇー。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\n今日も一日お疲れ様っス #ブルナポ応援企画 #ブルナポ夜の天気予報"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah3.jpg'
else:
    print(pattern)


# In[25]:


if pattern == "ptc":
    message = "こんばんはっ！上条春菜が明日のブルナポ天気予報をお伝えしますっ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。"+summary[:-1]+"になるみたいですよ！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\nお疲れ様ですっ！ささ、静岡茶と眼鏡をどうぞ！ #ブルナポ応援企画　#ブルナポ夜の天気予報"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh2.jpg'
else:
    print(pattern)


# In[26]:


if pattern == "ptd":
    message = "ご苦労様♪松本沙里奈がお送りする明日の天気予報よ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！特に"+summary[:-1]+"になりそう。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\n私の愛を込めたマッサージで癒してあげるわ♪#ブルナポ朝の天気予報"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms2.jpg'
else:
    print(pattern)


# In[27]:


if pattern == "pte":
    message = "今日も一日お疲れ様！川島瑞樹が明日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、"+summary[:-1]+"になりそうだわ。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ！\n\n○○君はこの後も仕事かしら？帰りはタクシーね #ブルナポ朝の天気予報"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km14.jpg'
else:
    print(message)


# In[28]:


auth = tweepy.OAuthHandler("Kwet0nyxsIv7FOIaRWeDXHzkF","blF1rKv0c75ha96pZI8dzZ2jccDPL4Aksrt5PlIktwoN8Aq3MC")
auth.set_access_token("1072666798657429504-CBMwvToplcGiaBKsS8Abh4xLSnxRGi","czFoC4pz8AbrozQ3KQlKWdPaDn1D5KCeQSXySrnG8f0fV")
api = tweepy.API(auth)


# In[29]:


api.update_with_media(filename = pic, status = message)


# In[ ]:




