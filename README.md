# Uber Remind Me!

> _**Use this at your own risk!**_

Send an email reminder to user when the best time to book uberGO is approaching!


## Algorithm

> Assumptions:
> 1. (`maxUberDuration`) Maximum time uberGO will take to arrive - _20 min_
> 2. (`deviation`) Maximum deviation due to traffic - _1 hr_
> 3. (`maxTravelDuration`) Maximum time to reach the destination - _Estimated Duration by Google Maps_ + `maxUberDuration` + `deviation`
> 4. Even if no uberGO is available at that time, remind the user!

```
func remind-me-uber (email, origin, destination, reachBy)

  calculate maxUberDuration, deviation, maxTravelDuration

  let leaveBefore = reachBy - deviation - Estimated Duration by Google Maps

  let thinkBefore = reachBy - maxTravelDuration

  :think

  if (thinkBefore - now > 5000) then
    schedule an event to :think at thinkBefore time
  else
    let uberGOTime = get time to arrive uberGO at origin

    if (leaveBefore - uberGOTime - now <= 0) then
      mark this user as already late

    send email to user
```

## API Usage

Google Maps API and Uber API is used only once per user!


## Demo

https://uber-remind-me.herokuapp.com


## Logs

https://uber-remind-me.herokuapp.com/logs


## License

MIT
