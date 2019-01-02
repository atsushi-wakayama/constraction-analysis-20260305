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


date = data['daily']['data'][0]['time']
high_temp_celsius = data['daily']['data'][0]['temperatureMax']
low_temp_celsius = data['daily']['data'][0]['temperatureMin']
weather = data['daily']['data'][0]['icon']
summary = data['daily']['data'][0]['summary']


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
else:
    print(a)


# In[10]:


if "partly-cloudy" in a:
    a = "くもり時々晴れ"
else:
    print(a)


# In[11]:


if "clear-day" in a:
    a = "晴れ"
else:
    print(a)


# In[12]:


if "cloudy" in a:
    a = "くもり"
else:
    print(a)


# In[13]:


if "snow" in a:
    a = "雪"
else:
    print(a)


# In[14]:


if "wind" in a:
    a = "強風"
else:
    print(a)


# In[15]:


summary = str(summary)


# In[53]:


l = ["pta","ptb","ptc","ptd","pte"]
pattern=random.choice(l)
print(pattern)


# In[51]:


if pattern == "pta":
    message = "あっ、おはようございます。佐々木千枝です。今日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です…\n…プロデューサーさん、千枝、ちゃんとできてます…よね？ #ブルナポ朝の天気予報 #ブルナポ応援企画"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc3.jpg'
else:
    print(pattern)


# In[29]:


if pattern == "ptb":
    message = "おはようございますっス！荒木比奈がお伝えする今日の天気予報っス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\nプロデューサー、ちゃんと見てくれてるっスか？#ブルナポ朝の天気予報 #ブルナポ応援企画"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah1.jpg'
else:
    print(pattern)


# In[19]:


if pattern == "ptc":
    message = "おはようございますっ！。上条春菜です！今日の天気予報をお伝えしますっ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\nさぁプロデューサーさん！眼鏡装着！あれ…わたしだけ！？#ブルナポ朝の天気予報 #ブルナポ応援企画"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh1.jpg'
else:
    print(pattern)


# In[56]:


if pattern == "ptd":
    message = "朝からごくろうさま♪松本沙理奈が今日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\nよっし、今日もバッチリ！プロデューサーも頑張ってきてね♪#ブルナポ朝の天気予報 #ブルナポ応援企画"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms1.jpg'
else:
    print(pattern)


# In[55]:


if pattern == "pte":
    message = "おはようございますっ♪...おほん！\n川島瑞樹が今日の天気をお伝えします。"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度になるでしょう\n\n...あらやだ、局アナの頃より調子いいかも...！ #ブルナポ朝の天気予報　#ブルナポ応援企画"
    print(message)
    pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km4.jpg'
else:
    print("OK")


# In[22]:


auth = tweepy.OAuthHandler("Kwet0nyxsIv7FOIaRWeDXHzkF","blF1rKv0c75ha96pZI8dzZ2jccDPL4Aksrt5PlIktwoN8Aq3MC")
auth.set_access_token("1072666798657429504-CBMwvToplcGiaBKsS8Abh4xLSnxRGi","czFoC4pz8AbrozQ3KQlKWdPaDn1D5KCeQSXySrnG8f0fV")
api = tweepy.API(auth)


# In[23]:


api.update_with_media(filename = pic, status = message)


# In[ ]:
