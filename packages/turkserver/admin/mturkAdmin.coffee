quals = -> Qualifications.find()
hitTypes = -> HITTypes.find()

Template.tsAdminMTurk.helpers
  selectedHITType: -> HITTypes.findOne Session.get("_tsSelectedHITType")

Template.tsAdminMTurk.events =
  "click .-ts-new-hittype": -> Session.set("_tsSelectedHITType", undefined)

Template.tsAdminHitTypes.events =
  "click tr": -> Session.set("_tsSelectedHITType", @_id)

Template.tsAdminHitTypes.helpers
  hitTypes: hitTypes
  selectedClass: ->
    if Session.equals("_tsSelectedHITType", @_id) then "info" else ""

Template.tsAdminViewHitType.events =
  "click .-ts-register-hittype": ->
    Meteor.call "ts-admin-register-hittype", @_id, (err, res) ->
      bootbox.alert(err.reason) if err
  "click .-ts-delete-hittype": ->
    HITTypes.remove(@_id)

Template.tsAdminViewHitType.helpers
  batchName: -> Batches.findOne(@batchId)?.name || "(none)"
  renderReward: -> @Reward.toFixed(2)
  qualName: -> Qualifications.findOne(""+@)?.name

Template.tsAdminNewHitType.events =
  "submit form": (e, tmpl) ->
    e.preventDefault()

    id = HITTypes.insert
      batchId: tmpl.find("select[name=batch]").value
      Title: tmpl.find("input[name=title]").value
      Description: tmpl.find("textarea[name=desc]").value
      Keywords: tmpl.find("input[name=keywords]").value
      Reward: parseFloat(tmpl.find("input[name=reward]").value)
      QualificationRequirements: $(tmpl.find("select[name=quals]")).val()
      AssignmentDurationInSeconds: parseInt(tmpl.find("input[name=duration]").value)
      AutoApprovalDelayInSeconds: parseInt(tmpl.find("input[name=delay]").value)

    Session.set("_tsSelectedHITType", id)

Template.tsAdminNewHitType.helpers
  quals: quals
  batches: -> Batches.find()

Template.tsAdminQuals.events =
  "click .-ts-delete-qual": ->
    Qualifications.remove(@_id)

Template.tsAdminQuals.helpers
  quals: quals
  value: ->
    if @IntegerValues
      return @IntegerValues + " (Integer)"
    else if @LocaleValues
      return @LocaleValues + " (Locale)"
    else
      return

Template.tsAdminNewQual.events =
  "click .-ts-create-qual": (e, tmpl) ->
    name = tmpl.find("input[name=name]").value
    type = tmpl.find("input[name=type]").value
    comp = tmpl.find("select[name=comp]").value
    value = tmpl.find("input[name=value]").value
    preview = tmpl.find("input[name=preview]").checked

    return if !name or !type or !comp

    qual =
      name: name
      QualificationTypeId: type
      Comparator: comp
      RequiredToPreview: preview

    try
      switch comp
        when "Exists", "DoesNotExist"
          throw new Error("No value should be specified for Exists or DoesNotExist") if !!value

        when "In", "NotIn"
          # Parse value as a comma-separated array
          vals = []
          type = null

          # Check that they are all the same type
          # TODO we don't check for the validity of the type here
          for v in value.split(/[\s,]+/)
            continue if !v

            if numV = parseInt(v)
              vals.push(numV)
              newType = "Integer"
            else
              vals.push(v)
              newType = "String"

            throw new Error("Must be all Integers or Locales") if type? and newType isnt type
            type = newType

          throw new Error("Must specify at least one value for In or NotIn") unless type?

          if type is "Integer"
            qual.IntegerValues = vals
          else
            qual.LocaleValues = vals

        else # Things with values
          if !!value
            if parseInt(value)
              qual.IntegerValues = value
            else
              qual.LocaleValues = value

      Qualifications.insert(qual)
    catch e
      bootbox.alert(e.toString())

Template.tsAdminHits.events =
  "click tr": -> Session.set("_tsSelectedHIT", @_id)
  "click .-ts-new-hit": -> Session.set("_tsSelectedHIT", undefined)

Template.tsAdminHits.helpers
  hits: -> HITs.find({}, {sort: {CreationTime: -1}})
  selectedHIT: -> HITs.findOne Session.get("_tsSelectedHIT")

Template.tsAdminViewHit.events =
  "click .-ts-refresh-hit": ->
    TurkServer.callWithModal "ts-admin-refresh-hit", @HITId

  "click .-ts-expire-hit": ->
    TurkServer.callWithModal "ts-admin-expire-hit", @HITId

  "submit .-ts-change-hittype": (e, tmpl) ->
    e.preventDefault()
    htId = tmpl.find("select[name=hittype]").value
    HITTypeId = HITTypes.findOne(htId).HITTypeId
    unless HITTypeId
      bootbox.alert("Register that HIT Type first")
      return

    params =
      HITId: @HITId
      HITTypeId: HITTypeId
    TurkServer.callWithModal "ts-admin-change-hittype", params

  "submit .-ts-extend-assignments": (e, tmpl) ->
    e.preventDefault()
    params =
      HITId: @HITId
      MaxAssignmentsIncrement: parseInt(tmpl.find("input[name=assts]").value)
    TurkServer.callWithModal "ts-admin-extend-hit", params

  "submit .-ts-extend-expiration": (e, tmpl) ->
    e.preventDefault()
    params =
      HITId: @HITId
      ExpirationIncrementInSeconds: parseInt(tmpl.find("input[name=secs]").value)
    TurkServer.callWithModal "ts-admin-extend-hit", params

Template.tsAdminViewHit.helpers
  hitTypes: hitTypes

Template.tsAdminNewHit.events =
  "submit form": (e, tmpl) ->
    e.preventDefault()

    hitTypeId = tmpl.find("select[name=hittype]").value

    unless hitTypeId
      bootbox.alert("HIT Type isn't registered")
      return

    params =
      MaxAssignments:parseInt(tmpl.find("input[name=maxAssts]").value)
      LifetimeInSeconds:parseInt(tmpl.find("input[name=lifetime]").value)

    TurkServer.callWithModal "ts-admin-create-hit", hitTypeId, params

Template.tsAdminNewHit.helpers
  hitTypes: hitTypes

Template.tsAdminWorkers.helpers
  settings: {
    position: "bottom",
    limit: 5,
    rules: [
      {
        collection: Meteor.users,
        field: "workerId",
        template: Template.tsAdminWorkerItem
        # Match on workerId or username
        selector: (match) ->
          $or: [
            { workerId: { $regex: "^" + match.toUpperCase() } },
            { username: { $regex: match, $options: "i" } }
          ]
      }
    ]
  }

  workerData: -> Workers.findOne(@workerId)

  workerActiveAssts: ->
    Assignments.find({
      workerId: @workerId,
      status: { $ne: "completed" }
    }, {
      sort: acceptTime: -1
    })

  workerCompletedAssts: ->
    Assignments.find({
      workerId: @workerId,
      status: "completed"
    }, {
      sort: submitTime: -1
    })

  numCompletedAssts: ->
    Assignments.find({
      workerId: @workerId,
      status: "completed"
    }).count()


Template.tsAdminWorkers.events
  "autocompleteselect input": (e, t, user) ->
    Router.go("tsWorkers", {workerId: user.workerId}) if user.workerId?

Template.tsAdminPanel.rendered = ->
  svg = d3.select(@find("svg"))
  $svg = @$("svg")

  margin =
    left: 90
    bottom: 30

  x = d3.scale.linear()
    .range([0, $svg.width() - margin.left])

  y = d3.scale.ordinal()
    # Data was originally stored in GMT -5 so just display that
    .domain(m.zone(300).format("HH ZZ") for m in TurkServer.Util._defaultTimeSlots())
    .rangeBands([0, $svg.height() - margin.bottom], 0.2)

  xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")

  yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")

  # Draw axes
  chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")

  chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + ($svg.height() - margin.bottom) + ")")
    .call(xAxis)

  chart.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -80)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Timezone")

  data = {}

  newData = false
  redraw = ->
    return unless newData
    newData = false

    entries = d3.entries(data)

    # Update domain with max value
    x.domain([0, d3.max(entries, (d) -> d.value)])
    chart.select("g.x.axis").call(xAxis)

    bars = chart.selectAll(".bar")
      .data(entries, (d) -> d.key)

    # Add any new bars in the enter selection
    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) -> y(d.key) )
      .attr("height", y.rangeBand());

    # Update widths in the update selection, including entered nodes
    bars.attr("data-value", (d) -> d.value )
      .transition()
      .attr("width", (d) -> x(d.value) )

  # Aggregate the worker times into the current timezone
  @handle = Workers.find().observeChanges
    added: (id, fields) ->
      # Only use data from workers who agreed to be contacted
      return unless fields.contact and fields.available?
      for time in fields.available.times
        # normalize into buckets
        continue unless time # Ignore invalid (empty) entries
        data[time] ?= 0
        data[time] += 1

      newData = true
      Meteor.defer(redraw)

Template.tsAdminPanel.destroyed = ->
  @handle.stop()

Template.tsAdminPanel.helpers
  workerContact: -> Workers.find(contact: true).count()
  workerTotal: -> Workers.find().count()

recipientsHelper = (recipients) ->
    if recipients.length == 1
      return recipients
    else
      return recipients.length

Template.tsAdminEmail.helpers
  messages: -> WorkerEmails.find({}, {sort: {sentTime: -1}})
  recipientsHelper: recipientsHelper

Template.tsAdminEmail.events
  "click tr": -> Session.set("_tsSelectedEmailId", @_id)

Template.tsAdminEmailMessage.helpers
  selectedMessage: ->
    emailId = Session.get("_tsSelectedEmailId")
    return WorkerEmails.findOne(emailId) if emailId?
  recipientsHelper: recipientsHelper

Template.tsAdminEmailMessage.events
  "click .ts-admin-send-message": ->
    TurkServer.callWithModal "ts-admin-send-message", @_id

  "click .ts-admin-resend-message": ->
    TurkServer.callWithModal "ts-admin-resend-message", @_id

  "click .ts-admin-copy-message": ->
    TurkServer.callWithModal "ts-admin-copy-message", @_id

  "click .ts-admin-delete-message": ->
    TurkServer.callWithModal "ts-admin-delete-message", @_id

Template.tsAdminNewEmail.helpers
  messages: ->
    WorkerEmails.find({}, {
      fields: {subject: 1},
      sort: {sentTime: -1}
    })

Template.tsAdminNewEmail.events
  "submit form": (e, t) ->
    e.preventDefault()
    $sub = t.$("input[name=subject]")
    $msg = t.$("textarea[name=message]")

    subject = $sub.val()
    message = $msg.val()

    if t.$("input[name=recipients]:checked").val() is "copy"
      copyFromId = t.$("select[name=copyFrom]").val()
      unless copyFromId?
        bootbox.alert("Select an e-mail to copy recipients from")
        return

    TurkServer.callWithModal "ts-admin-create-message", subject, message, copyFromId, (res) ->
      # Display the new message
      Session.set("_tsSelectedEmailId", res)

Template.tsAdminAssignmentMaintenance.events
  "click .-ts-cancel-assignments": ->
    message = "This will cancel all assignments of users are disconnected. You should only do this if these users will definitely not return to their work. Continue? "
    bootbox.confirm message, (res) ->
      return unless res
      TurkServer.callWithModal "ts-admin-cancel-assignments", Session.get("_tsViewingBatchId")

numAssignments = -> Assignments.find().count()

Template.tsAdminActiveAssignments.helpers
  numAssignments: numAssignments
  activeAssts: ->
    Assignments.find {}, { sort: acceptTime: -1 }

checkBatch = (batchId) ->
  unless batchId?
    bootbox.alert("Select a batch first!")
    return false
  return true

Template.tsAdminCompletedMaintenance.events
  "click .-ts-refresh-assignments": ->
    batchId = Session.get("_tsViewingBatchId")
    return unless checkBatch(batchId)
    TurkServer.callWithModal "ts-admin-refresh-assignments", batchId

  "click .-ts-approve-all": ->
    batchId = Session.get("_tsViewingBatchId")
    return unless checkBatch(batchId)

    TurkServer.callWithModal "ts-admin-count-submitted", batchId, (count) ->
      if count is 0
        bootbox.alert "No assignments to approve!"
        return

      bootbox.prompt "#{count} assignments will be approved. Enter a (possibly blank) message to send to each worker.", (res) ->
        return unless res?
        TurkServer.callWithModal "ts-admin-approve-all", batchId, res

  "click .-ts-pay-bonuses": ->
    batchId = Session.get("_tsViewingBatchId")
    return unless checkBatch(batchId)

    TurkServer.callWithModal "ts-admin-count-unpaid-bonuses", batchId, (data) ->
      if data.numPaid is 0
        bootbox.alert "No bonuses to pay!"
        return

      bootbox.prompt "#{data.numPaid} workers will be paid, for a total of $#{data.amt}. Enter a message to send to each worker.", (res) ->
        return unless res
        TurkServer.callWithModal "ts-admin-pay-bonuses", batchId, res

Template.tsAdminCompletedAssignments.events
  "submit form.ts-admin-assignment-filter": (e, t) ->
    e.preventDefault()

    Router.go "tsCompletedAssignments",
      days: parseInt(t.find("input[name=filter_days]").value) ||
        TurkServer.adminSettings.defaultDaysThreshold
      limit: parseInt(t.find("input[name=filter_limit]").value) ||
        TurkServer.adminSettings.defaultLimit

Template.tsAdminCompletedAssignments.helpers
  numAssignments: numAssignments
  completedAssts: ->
    Assignments.find {}, { sort: submitTime: -1 }

Template.tsAdminCompletedAssignmentsTable.events
  "click .ts-admin-refresh-assignment": ->
    TurkServer.callWithModal "ts-admin-refresh-assignment", this._id

  "click .ts-admin-approve-assignment": ->
    _asstId = this._id
    bootbox.prompt "Approve assignment: enter an optional message to send to the worker.", (res) ->
      TurkServer.callWithModal "ts-admin-approve-assignment", _asstId, res

  "click .ts-admin-reject-assignment": ->
    _asstId = this._id
    bootbox.prompt "1 worker's assignment will be rejected. Enter a message to send to the worker.", (res) ->
      return unless res
      TurkServer.callWithModal "ts-admin-reject-assignment", _asstId, res

  "click .ts-admin-unset-bonus": ->
    Meteor.call("ts-admin-unset-bonus", this._id)

  "click .ts-admin-pay-bonus": ->
    TurkServer._displayModal Template.tsAdminPayBonus, this

Template.tsAdminCompletedAssignmentRow.helpers
  labelStatus: ->
    switch @mturkStatus
      when "Submitted" then "label-warning"
      when "Approved" then "label-primary"
      when "Rejected" then "label-danger"
      else "label-default"
  submitted: ->
    return @mturkStatus == "Submitted"
