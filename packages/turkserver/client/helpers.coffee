UI.registerHelper "_tsDebug", ->
  console.log @, arguments

TurkServer.Util ?= {}

TurkServer.Util._defaultTimeSlots = ->
  # Default time selections: 9AM EST to 11PM EST
  m = moment.utc(hours: 9 + 5).local()
  return (m.clone().add(x, 'hours') for x in [0..14])

# Submit as soon as this template appears on the page.
Template.mturkSubmit.rendered = -> @find("form").submit()

Template.tsTimePicker.helpers
  zone: -> moment().format("Z")

Template.tsTimeOptions.helpers
  momentList: TurkServer.Util._defaultTimeSlots

Template.tsTimeOptions.helpers
  # Store all values in GMT-5
  valueFormatted: -> @zone(300).format('HH ZZ')
  # Display values in user's timezone
  displayFormatted: -> @local().format('hA [UTC]Z')

###
  Submits the exit survey data to the server and submits the HIT if successful
###
TurkServer.submitExitSurvey = (results, panel) ->
  Meteor.call "ts-submit-exitdata", results, panel, (err, res) ->
    bootbox.alert(err) if err

    if res
      TurkServer.submitHIT()
      # TODO: log the user out here? Maybe doesn't matter because resume login will be disabled

TurkServer.submitHIT = -> Blaze.render(Template.mturkSubmit, document.body)

