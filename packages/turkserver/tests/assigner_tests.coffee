batch = null

withCleanup = TestUtils.getCleanupWrapper
  before: ->
    # Create a random batch and corresponding lobby for assigner tests
    batchId = Batches.insert({})
    batch = TurkServer.Batch.getBatch(batchId)
  after: ->
    Experiments.remove { batchId: batch.batchId }
    Assignments.remove { batchId: batch.batchId }

tutorialTreatments = [ "tutorial" ]
groupTreatments = [ "group" ]

TurkServer.ensureTreatmentExists
  name: "tutorial"
TurkServer.ensureTreatmentExists
  name: "group"

createAssignment = ->
  workerId = Random.id()
  userId = Accounts.insertUserDoc {}, { workerId }
  return TurkServer.Assignment.createAssignment
    batchId: batch.batchId
    hitId: Random.id()
    assignmentId: Random.id()
    workerId: workerId
    acceptTime: new Date()
    status: "assigned"

Tinytest.add "assigners - tutorialGroup - assigner picks up existing instance", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialGroupAssigner(tutorialTreatments, groupTreatments)

  instance = batch.createInstance(groupTreatments)
  instance.setup()

  batch.setAssigner(assigner)

  test.equal assigner.instance, instance
  test.equal assigner.autoAssign, true

Tinytest.add "assigners - tutorialGroup - initial lobby gets tutorial", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialGroupAssigner(tutorialTreatments, groupTreatments)
  batch.setAssigner(assigner)

  test.equal assigner.autoAssign, false

  asst = createAssignment()
  TestUtils.connCallbacks.sessionReconnect {userId: asst.userId}

  TestUtils.sleep(150) # YES!!

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  test.equal user.turkserver.state, "experiment"
  test.length instances, 1

  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 0
  exp = Experiments.findOne(instances[0].id)
  test.equal exp.treatments, tutorialTreatments

Tinytest.add "assigners - tutorialGroup - autoAssign event triggers properly", withCleanup (test) ->

  assigner = new TurkServer.Assigners.TutorialGroupAssigner(tutorialTreatments, groupTreatments)
  batch.setAssigner(assigner)

  asst = createAssignment()
  # Pretend we already have a tutorial done
  tutorialInstance = batch.createInstance(tutorialTreatments)
  tutorialInstance.setup()
  tutorialInstance.addAssignment(asst)
  tutorialInstance.teardown()

  TestUtils.sleep(100) # So the user joins the lobby properly

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  test.equal user.turkserver.state, "lobby"
  test.length instances, 1

  batch.lobby.events.emit("auto-assign")

  TestUtils.sleep(100)

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  test.equal user.turkserver.state, "experiment"
  test.length instances, 2

  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 0
  exp = Experiments.findOne(instances[1].id)
  test.equal exp.treatments, groupTreatments

Tinytest.add "assigners - tutorialGroup - final send to exit survey", withCleanup (test) ->

  assigner = new TurkServer.Assigners.TutorialGroupAssigner(tutorialTreatments, groupTreatments)
  batch.setAssigner(assigner)

  asst = createAssignment()
  # Pretend we already have a tutorial done
  tutorialInstance = batch.createInstance(tutorialTreatments)
  tutorialInstance.setup()
  tutorialInstance.addAssignment(asst)
  tutorialInstance.teardown()

  TestUtils.sleep(100) # So the user joins the lobby properly

  groupInstance = batch.createInstance(groupTreatments)
  groupInstance.setup()
  groupInstance.addAssignment(asst)
  groupInstance.teardown()

  TestUtils.sleep(100)

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  test.equal user.turkserver.state, "exitsurvey"
  test.length instances, 2

# Setup for multi tests below
TurkServer.ensureTreatmentExists
  name: "tutorial"

TurkServer.ensureTreatmentExists
  name: "parallel_worlds"

multiGroupTreatments = [ "parallel_worlds" ]

###
  Randomized multi-group assigner
###

Tinytest.add "assigners - tutorialRandomizedGroup - initial lobby gets tutorial", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, [8, 16, 32])

  batch.setAssigner(assigner)

  asst = createAssignment()
  TestUtils.connCallbacks.sessionReconnect {userId: asst.userId}

  TestUtils.sleep(150)

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  # should be in experiment
  test.equal user.turkserver.state, "experiment"
  test.length instances, 1
  # should not be in lobby
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 0
  # should be in a tutorial
  exp = Experiments.findOne(instances[0].id)
  test.equal exp.treatments, tutorialTreatments

Tinytest.add "assigners - tutorialRandomizedGroup - send to exit survey", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, [8, 16, 32])

  batch.setAssigner(assigner)

  asst = createAssignment()
  # Pretend we already have two instances done
  Assignments.update asst.asstId,
    $push: {
      instances: {
        $each: [
          { id: Random.id() },
          { id: Random.id() }
        ]
      }
    }

  TestUtils.connCallbacks.sessionReconnect({userId: asst.userId})

  TestUtils.sleep(100)

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  test.equal user.turkserver.state, "exitsurvey"
  test.length instances, 2

Tinytest.add "assigners - tutorialRandomizedGroup - set up instances", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, [8, 16, 32])

  batch.setAssigner(assigner)

  assigner.setup()

  # Verify that four instances were created with the right treatments
  created = Experiments.find({ batchId: batch.batchId }).fetch()

  test.length created, 4

  # Sort by group size and test
  created.sort (a, b) ->
    if a.treatments[0] is "parallel_worlds" then 1
    else if b.treatments[0] is "parallel_worlds" then -1
    # grab the part after "group_"
    else parseInt(a.treatments[0].substring(6)) - parseInt(b.treatments[0].substring(6))

  test.equal created[0].treatments, [ "group_8", "parallel_worlds" ]
  test.equal created[1].treatments, [ "group_16", "parallel_worlds" ]
  test.equal created[2].treatments, [ "group_32", "parallel_worlds" ]
  # Buffer group
  test.equal created[3].treatments, [ "parallel_worlds" ]

  # Test that there are 56 randomization slots now with the right allocation
  test.isFalse assigner.autoAssign
  test.isTrue assigner.bufferInstanceId

  test.length assigner.instanceSlots, 56
  test.equal assigner.instanceSlotIndex, 0

  allocation = _.countBy(assigner.instanceSlots, Object)
  test.equal allocation[created[0]._id], 8
  test.equal allocation[created[1]._id], 16
  test.equal allocation[created[2]._id], 32

  # Calling setup again should not do anything
  assigner.setup()

  test.length Experiments.find({ batchId: batch.batchId }).fetch(), 4

Tinytest.add "assigners - tutorialRandomizedGroup - set up reusing existing instances", withCleanup (test) ->
  groupArr = [
    1, 1, 1, 1, 1, 1, 1, 1,
    2, 2, 2, 2,
    4, 4,
    8, 16, 32
  ]

  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  # Create one existing treatment of group size 1
  instance = batch.createInstance( ["group_1"].concat(multiGroupTreatments) )
  instance.setup()

  batch.setAssigner(assigner)

  assigner.setup()

  # Verify that 18 instances were created with the right treatments
  created = Experiments.find({ batchId: batch.batchId }).fetch()

  test.length created, 18

  # Test that there are 56 randomization slots now with the right allocation
  test.isFalse assigner.autoAssign
  test.isTrue assigner.bufferInstanceId

  test.length assigner.instanceSlots, 80
  test.equal assigner.instanceSlotIndex, 0

Tinytest.add "assigners - tutorialRandomizedGroup - pick up existing instances", withCleanup (test) ->
  groupArr = [8, 16, 32]
  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  # Generate the config that the group assigner would have
  groupConfig = TurkServer.Assigners.TutorialRandomizedGroupAssigner
    .generateConfig(groupArr, multiGroupTreatments)

  created = []

  for conf, i in groupConfig
    instance = batch.createInstance(conf.treatments)
    instance.setup()

    created.push(instance.groupId)

  batch.setAssigner(assigner)

  # Test that there are 56 randomization slots now with the right allocation
  test.isFalse assigner.autoAssign
  test.isTrue assigner.bufferInstanceId

  test.length assigner.instanceSlots, 56
  test.equal assigner.instanceSlotIndex, 0

  allocation = _.countBy(assigner.instanceSlots, Object)
  test.equal allocation[created[0]], 8
  test.equal allocation[created[1]], 16
  test.equal allocation[created[2]], 32

Tinytest.add "assigners - tutorialRandomizedGroup - resume with partial allocation", withCleanup (test) ->
  groupArr = [8, 16, 32]
  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  # Generate the config that the group assigner would have
  groupConfig = TurkServer.Assigners.TutorialRandomizedGroupAssigner
    .generateConfig(groupArr, multiGroupTreatments)

  created = []

  for conf, i in groupConfig
    instance = batch.createInstance(conf.treatments)
    instance.setup()

    # Fill each group half full
    for j in [1..conf.size/2]
      asst = createAssignment()

      # Pretend like this instance did the tutorial
      tutorialInstance = batch.createInstance(tutorialTreatments)
      tutorialInstance.setup()
      tutorialInstance.addAssignment(asst)
      tutorialInstance.teardown()

      instance.addAssignment(asst)

    created.push(instance.groupId)

  # Run it
  batch.setAssigner(assigner)

  # Test that there are 28 randomization slots now with the right allocation
  # auto-assign should be enabled because there are people in it
  test.isTrue assigner.autoAssign
  test.isTrue assigner.bufferInstanceId

  test.length assigner.instanceSlots, 28
  test.equal assigner.instanceSlotIndex, 0

  allocation = _.countBy(assigner.instanceSlots, Object)
  test.equal allocation[created[0]], 8/2
  test.equal allocation[created[1]], 16/2
  test.equal allocation[created[2]], 32/2

Tinytest.add "assigners - tutorialRandomizedGroup - resume with fully allocated groups", withCleanup (test) ->
  groupArr = [8, 16, 32]
  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  # Generate the config that the group assigner would have
  groupConfig = TurkServer.Assigners.TutorialRandomizedGroupAssigner
    .generateConfig(groupArr, multiGroupTreatments)

  created = []

  for conf, i in groupConfig
    instance = batch.createInstance(conf.treatments)
    instance.setup()

    # Fill each group half full
    for j in [1..conf.size]
      asst = createAssignment()

      # Pretend like this instance did the tutorial
      tutorialInstance = batch.createInstance(tutorialTreatments)
      tutorialInstance.setup()
      tutorialInstance.addAssignment(asst)
      tutorialInstance.teardown()

      instance.addAssignment(asst)

    created.push(instance.groupId)

  # Run it
  batch.setAssigner(assigner)

  # auto-assign should be enabled because there are people in it
  test.isTrue assigner.autoAssign
  test.isTrue assigner.bufferInstanceId

  test.length assigner.instanceSlots, 0
  test.equal assigner.instanceSlotIndex, 0

Tinytest.add "assigners - tutorialRandomizedGroup - assign with waiting room and sequential", withCleanup (test) ->
  groupArr = [8, 16, 32]

  assigner = new TurkServer.Assigners.TutorialRandomizedGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  batch.setAssigner(assigner)

  assigner.setup() # Create instances

  test.isFalse assigner.autoAssign
  test.length assigner.instanceSlots, 56
  test.equal assigner.instanceSlotIndex, 0

  # Get the config that the group assigner would have
  groupConfigMulti = assigner.groupConfig

  assts = (createAssignment() for i in [1..64])

  # Pretend they have all done the tutorial
  for asst in assts
    Assignments.update asst.asstId,
      $push: { instances: { id: Random.id() } }

  # Make the first half join
  for i in [0..27]
    TestUtils.connCallbacks.sessionReconnect({userId: assts[i].userId})

  TestUtils.sleep(500) # Give enough time for lobby functions to process

  # should have 32 users in lobby
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 28

  # Run auto-assign
  assigner.assignAll()

  test.isTrue assigner.autoAssign
  test.length assigner.instanceSlots, 56
  test.equal assigner.instanceSlotIndex, 28

  TestUtils.sleep(500) # Give enough time for lobby functions to process
  # should have 0 users in lobby
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 0

  exps = Experiments.find({ batchId: batch.batchId }).fetch()

  # Check that the groups have the right size and treatments
  totalAdded = 0
  for exp in exps
    instance = TurkServer.Instance.getInstance(exp._id)
    groupSize = instance.treatment().groupSize

    if groupSize?
      users = instance.users()
      test.isTrue users.length < groupSize
      totalAdded += users.length
    else # Buffer group should be empty
      test.length instance.users(), 0

  test.equal totalAdded, 28

  # Fill in remaining users
  for i in [28..63]
    TestUtils.connCallbacks.sessionReconnect({userId: assts[i].userId})

  test.isTrue assigner.autoAssign
  test.length assigner.instanceSlots, 56
  test.equal assigner.instanceSlotIndex, 56

  TestUtils.sleep(800)

  # Should have no one in lobby
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 0

  # All groups should be filled with 8 in buffer
  totalAdded = 0
  for exp in exps
    instance = TurkServer.Instance.getInstance(exp._id)
    groupSize = instance.treatment().groupSize

    users = instance.users()

    if groupSize?
      test.length users, groupSize
      totalAdded += users.length
    else # Buffer group should have 8 users
      test.length users, 8
      totalAdded += users.length

  test.equal totalAdded, 64

  # Test auto-stopping
  lastInstance = TurkServer.Instance.getInstance(assigner.bufferInstanceId)
  lastInstance.teardown()

  slackerAsst = createAssignment()

  Assignments.update slackerAsst.asstId,
    $push: { instances: { id: Random.id() } }

  TestUtils.connCallbacks.sessionReconnect({userId: slackerAsst.userId})

  TestUtils.sleep(150)

  # ensure that user is still in lobby
  user = Meteor.users.findOne(slackerAsst.userId)
  instances = slackerAsst.getInstances()

  # should still be in lobby
  test.equal user.turkserver.state, "lobby"
  test.length instances, 1
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 1

###
  Multi-group assigner
###

Tinytest.add "assigners - tutorialMultiGroup - initial lobby gets tutorial", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialMultiGroupAssigner(
    tutorialTreatments, multiGroupTreatments, [16, 16])
  batch.setAssigner(assigner)

  asst = createAssignment()
  TestUtils.connCallbacks.sessionReconnect {userId: asst.userId}

  TestUtils.sleep(150) # YES!!

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  # should be in experiment
  test.equal user.turkserver.state, "experiment"
  test.length instances, 1
  # should not be in lobby
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 0
  # should be in a tutorial
  exp = Experiments.findOne(instances[0].id)
  test.equal exp.treatments, tutorialTreatments

Tinytest.add "assigners - tutorialMultiGroup - resumes from partial", withCleanup (test) ->
  groupArr = [ 1, 1, 1, 1, 2, 2, 4, 4, 8, 16, 32, 16, 8, 4, 4, 2, 2, 1, 1, 1, 1 ]

  assigner = new TurkServer.Assigners.TutorialMultiGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  # Generate the config that the group assigner would have
  groupConfigMulti = TurkServer.Assigners.TutorialMultiGroupAssigner
    .generateConfig(groupArr, multiGroupTreatments)

  borkedGroup = 10
  filledAmount = 16

  # Say we are in the middle of the group of 32: index 10
  for conf, i in groupConfigMulti
    break if i == borkedGroup

    instance = batch.createInstance(conf.treatments)
    instance.setup()

    for j in [1..conf.size]
      asst = createAssignment()

      # Pretend like this instance did the tutorial
      tutorialInstance = batch.createInstance(tutorialTreatments)
      tutorialInstance.setup()
      tutorialInstance.addAssignment(asst)
      tutorialInstance.teardown()

      instance.addAssignment(asst)

  conf = groupConfigMulti[borkedGroup]
  instance = batch.createInstance(conf.treatments)
  instance.setup()
  ( instance.addAssignment(createAssignment()) for j in [1..filledAmount] )

  batch.setAssigner(assigner)

  test.equal assigner.currentGroup, borkedGroup
  test.equal assigner.currentInstance, instance
  test.equal assigner.currentFilled, filledAmount

Tinytest.add "assigners - tutorialMultiGroup - resumes on group boundary", withCleanup (test) ->
  groupArr = [ 1, 1, 1, 1, 2, 2, 4, 4, 8, 16, 32, 16, 8, 4, 4, 2, 2, 1, 1, 1, 1 ]

  assigner = new TurkServer.Assigners.TutorialMultiGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  # Generate the config that the group assigner would have
  groupConfigMulti = TurkServer.Assigners.TutorialMultiGroupAssigner
    .generateConfig(groupArr, multiGroupTreatments)

  borkedGroup = 2

  # Say we are in the middle of the group of 32: index 10
  for conf, i in groupConfigMulti
    break if i == borkedGroup

    instance = batch.createInstance(conf.treatments)
    instance.setup()

    for j in [1..conf.size]
      asst = createAssignment()

      # Pretend like this instance did the tutorial
      tutorialInstance = batch.createInstance(tutorialTreatments)
      tutorialInstance.setup()
      tutorialInstance.addAssignment(asst)
      tutorialInstance.teardown()

      instance.addAssignment(asst)

  batch.setAssigner(assigner)

  test.equal assigner.currentGroup, borkedGroup - 1
  test.equal assigner.currentInstance, instance
  test.equal assigner.currentFilled, groupConfigMulti[borkedGroup - 1].size

  # Test reconfiguration into new groups
  newArray = [16, 16]
  assigner.configure(newArray)

  test.equal assigner.groupArray, newArray
  test.equal assigner.currentGroup, -1
  test.equal assigner.currentInstance, null
  test.equal assigner.currentFilled, 0

Tinytest.add "assigners - tutorialMultiGroup - send to exit survey", withCleanup (test) ->
  assigner = new TurkServer.Assigners.TutorialMultiGroupAssigner(
    tutorialTreatments, multiGroupTreatments, [16, 16])

  batch.setAssigner(assigner)

  asst = createAssignment()
  # Pretend we already have two instances done
  Assignments.update asst.asstId,
    $push: {
      instances: {
        $each: [
          { id: Random.id() },
          { id: Random.id() }
        ]
      }
    }

  TestUtils.connCallbacks.sessionReconnect({userId: asst.userId})

  TestUtils.sleep(100)

  user = Meteor.users.findOne(asst.userId)
  instances = asst.getInstances()

  test.equal user.turkserver.state, "exitsurvey"
  test.length instances, 2

Tinytest.add "assigners - tutorialMultiGroup - simultaneous multiple assignment", withCleanup (test) ->
  groupArr = [ 1, 1, 1, 1, 2, 2, 4, 4, 8, 16, 32 ]

  assigner = new TurkServer.Assigners.TutorialMultiGroupAssigner(
    tutorialTreatments, multiGroupTreatments, groupArr)

  batch.setAssigner(assigner)

  # Get the config that the group assigner would have
  groupConfigMulti = assigner.groupConfig

  assts = (createAssignment() for i in [1..80])

  # Pretend they have all done the tutorial
  for asst in assts
    Assignments.update asst.asstId,
      $push: { instances: { id: Random.id() } }

  # Make them all join simultaneously - lobby join is deferred
  for asst in assts
    # TODO some sort of weirdness (write fence?) prevents us from deferring these
    TestUtils.connCallbacks.sessionReconnect({userId: asst.userId})

  TestUtils.sleep(500) # Give enough time for lobby functions to process

  exps = Experiments.find({batchId: batch.batchId}, {sort: {startTime: 1}}).fetch()

  # Check that the groups have the right size and treatments
  i = 0
  while i < groupConfigMulti.length
    group = groupConfigMulti[i]
    exp = exps[i]

    test.equal(exp.treatments[0], group.treatments[0])
    test.equal(exp.treatments[1], group.treatments[1])

    test.equal(exp.users.length, group.size)

    i++

  test.length exps, groupConfigMulti.length

  # Should have people in lobby
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 8

  # Test auto-stopping
  lastInstance = TurkServer.Instance.getInstance(exps[exps.length - 1]._id)
  lastInstance.teardown()

  slackerAsst = createAssignment()

  Assignments.update slackerAsst.asstId,
    $push: { instances: { id: Random.id() } }

  TestUtils.connCallbacks.sessionReconnect({userId: slackerAsst.userId})

  TestUtils.sleep(150)

  # assigner should have stopped
  test.equal assigner.stopped, true

  # ensure that user is still in lobby
  user = Meteor.users.findOne(slackerAsst.userId)
  instances = slackerAsst.getInstances()

  # should still be in lobby
  test.equal user.turkserver.state, "lobby"
  test.length instances, 1
  test.equal LobbyStatus.find(batchId: batch.batchId).count(), 9

  # Test resetting, if we launch new set a different day
  batch.lobby.events.emit("reset-multi-groups")

  test.equal assigner.stopped, false
  test.equal assigner.groupArray, groupArr # Still same config
  test.equal assigner.currentGroup, -1
  test.equal assigner.currentInstance, null
  test.equal assigner.currentFilled, 0
