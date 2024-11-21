BYUB Coding Exercise
===================

Given the JSON file [rest_hours.json](https://github.com/rodneyallanprice/byub/blob/master/data/rest_hours.json), write an application that allows the user to specify a date and time and returns a list of restaurant names that are open.

Assumptions:
- If a day of the week is not listed, the restaurant is closed on that day
- All times are local — don’t worry about time zone - awareness
- The JSON file is well-formed but data may need to be further parsed



Usage - Command line:
===================

```
./findfood.sh Wednesday 12:15 pm

```
or

```
node ./findfood.js Wednesday 12:15 pm

```

Usage - Start the server:
===================

```
npm start

```

Endpoint
===================

## POST /open

#### Example body
```
{
  "day": "Wednesday",
  "time": "12:15 PM"
}
```

#### Example return value
```
[
  {
    "name": "Cheesecake Factory",
    "closes": "11:30 PM"
  }
  ...
]
```
