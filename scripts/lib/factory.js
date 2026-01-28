/*
 * Copyright (c) 2019 ANSYS medini Technologies AG
 * All rights reserved.
 * 
 * The script is provided "as is" without warranty of any kind. 
 * ANSYS medini Technologies AG disclaims all warranties, either express or implied, 
 * including the warranties of merchantability and fitness for a particular purpose.
 * 
 * v2019-01-30 - added support for version 2019 R1
 * v2018-08-24 - added support for Checklist template usage
 * v2018-06-18 - added support for Hazard and Error
 * v2018-06-12 - fixed return value for FailureRelation and SafetyReqRelation
 * v2018-02-28 - added support for SysMLDependency and SysMLAbstraction
 * v2018-02-14 - added support for FRVariable
 * v2017-10-18 - added support for SysMLConnector
 * v2017-09-13
 */
if (!bind) {
    throw "This script requires extended API";
}

// bind operations (NOT OFFICIAL API YET)
var AddPackageOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddPackageOperation", false);
var AddFunctionOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddFunctionOperation", false);
var AddMalfunctionOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddMalfunctionOperation", false);
var AddFailureModeOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddFailureModeOperation", false);
var AddHazardOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddHazardOperation", false);
var AddErrorOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddErrorOperation", false);
var AddMeasureOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddMeasureOperation", false);
var AddSafetyRequirementOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddSafetyRequirementOperation", false);
var AddSafetyGoalOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddSafetyGoalOperation", false);
var AddSafetyMechanismOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.AddSafetyMechanismOperation", false);
var CreateTraceOperation = bind("de.ikv.medini.kernel.traceability", "de.ikv.medini.kernel.traceability.operations.CreateTraceOperation", false);
var MediniModelModificationUtil = bind("de.ikv.medini.util.emf.plugin", "de.ikv.medini.util.emf.edit.MediniModelModificationUtil", false);
var SafetyModelUtil = bind("de.ikv.medini.metamodel.safety", "de.ikv.medini.metamodel.safetyModel.util.SafetyModelUtil", false);
var SafetyGoalsUtils = bind("de.ikv.analyze.metamodel.safetygoals", "de.ikv.analyze.metamodel.safetygoals.util.SafetyGoalsUtils", false);
 
var CreateHazardAnalysisModelOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.CreateHazardAnalysisModelOperation", false);
var CreateFMEAWorksheetOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.CreateFMEAWorksheetOperation", false);
var CreateFTAModelOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.CreateFTAModelOperation", false);
var CreateChecklistOperation = bind("de.ikv.analyze.editor.creation.checklist", "de.ikv.analyze.editor.creation.checklist.operations.CreateChecklistOperation", false);
var CreateSafetyGoalModelOperation = bind("de.ikv.analyze.safetygoal.core", "de.ikv.analyze.safetygoal.core.operations.CreateSafetyGoalModelOperation", false);
// TODO: This operation did not exist in 3.2.2 and was introduced with 3.2.3 - avoid breaking scripts
var ImportChecklistReviewOperation = undefined;
 
var SysmlFactory = bind("de.ikv.medini.metamodel.sysml", "de.ikv.medini.metamodel.sysml.SysmlFactory", false);
var SafetyModelFactory = bind("de.ikv.medini.metamodel.safety", "de.ikv.medini.metamodel.safetyModel.SafetyModelFactory", false);
var SafetyGoalsFactory = bind("de.ikv.analyze.metamodel.safetygoals", "de.ikv.analyze.metamodel.safetygoals.SafetyGoalsFactory", false);
var FMEAFactory = bind("de.ikv.medini.metamodel.fmea", "de.ikv.medini.metamodel.FMEA.FMEAFactory", false);
var HazardAnalysisFactory = bind("de.ikv.analyze.metamodel.hazard", "de.ikv.analyze.metamodel.hazard.HazardAnalysisFactory", false);
var FTAFactory = bind("de.ikv.medini.metamodel.fta", "de.ikv.medini.metamodel.FTA.FTAFactory", false);
var ChecklistFactory = bind("de.ikv.analyze.metamodel.checklist", "de.ikv.analyze.metamodel.checklist.ChecklistFactory", false);
var TransactionUtil = bind("org.eclipse.emf.transaction", "org.eclipse.emf.transaction.util.TransactionUtil", false);
var DCFactory = bind("de.ikv.analyze.metamodel.dc", "de.ikv.analyze.metamodel.dc.DcFactory", false);
 
var CreateNewFailureCollectionOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.CreateNewFailureCollectionOperation", false);
var CreateNewMeasureCatalogOperation = bind("de.ikv.analyze.core", "de.ikv.analyze.core.operations.CreateNewMeasureCatalogOperation", false);
var SysMLConnectorCreateCommand = bind("de.ikv.medini.editor.sysml.block.diagram", "de.ikv.medini.editor.sysml.block.diagram.edit.commands.SysMLConnectorCreateCommand", false);
var SysMLDependencyCreateCommand = bind("de.ikv.medini.editor.sysml.block.diagram", "de.ikv.medini.editor.sysml.block.diagram.edit.commands.SysMLDependencyCreateCommand", false);
var AnalyzeSystemAllocateOperation = bind("de.ikv.analyze.sysml.core", "de.ikv.analyze.sysml.core.operations.AnalyzeSystemAllocateOperation", false);
var SysMLModelUtils = bind("de.ikv.medini.sysml.core", "de.ikv.medini.sysml.core.SysMLModelUtils", false);

var FailureRateCatalogsFactory = bind("de.ikv.medini.metamodel.failureratecatalogs", "de.ikv.medini.metamodel.failureratecatalogs.FailureRateCatalogsFactory", false);
var FailureRateCatalogsPackage = bind("de.ikv.medini.metamodel.failureratecatalogs", "de.ikv.medini.metamodel.failureratecatalogs.FailureRateCatalogsPackage", false);
	

var SafetyReqKind = bind("de.ikv.analyze.metamodel.safetygoals", "de.ikv.analyze.metamodel.safetygoals.SafetyReqKind", false);
var SysMLFlowDirection = bind("de.ikv.medini.metamodel.sysml", "de.ikv.medini.metamodel.sysml.SysMLFlowDirection", false);
var FailureType = bind("de.ikv.medini.metamodel.safety", "de.ikv.medini.metamodel.safetyModel.FailureType", false);


// helper
function __createTrace(from, to) {
    // create one
    var domain = TransactionUtil.getEditingDomain(from);
    var op = new CreateTraceOperation(domain, "Link", from, to, "");
    op.execute(null, null);
    return op.getTrace();
}
 
// helper
function __createFailureRelation(cause, effect) {
    return SafetyModelUtil.INSTANCE.addFailureRelation(cause, effect);
}
 
// helper
function __createContributesRelation(source, target) {
    var kind = SafetyGoalsFactory.eINSTANCE.createFromString(Metamodel.safetygoals.SafetyReqRelationKind, "UNSPECIFIED");
    var relation = SafetyGoalsUtils.createSafetyRelation(source, target, kind);
    MediniModelModificationUtil.addValueOfFeature(source.model, Metamodel.safetygoals.SafetyRequirementsModel.reqRelations, relation);
    return relation;
}
 
// helper
function __createPart(scope) {
    var part = SysmlFactory.eINSTANCE.create(Metamodel.sysml.SysMLPart);
    part.typeCode = "Generic";
    part.name = "new part";
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.sysml.SysMLPart.the_owned_elements;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, part);
 
    return part;
}
 
// helper
function __createContainerPackage(scope) {
    var pkg = SysmlFactory.eINSTANCE.create(Metamodel.sysml.SysMLContainerPackage);
    pkg.name = "new package";
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.sysml.SysMLElement.the_owned_elements;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, pkg);
 
    return pkg;
}

// helper
function __createActivity(scope) {
    var activity = SysmlFactory.eINSTANCE.create(Metamodel.sysml.SysMLActivity);
    activity.name = "new activity";
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.sysml.SysMLPart.the_owned_elements;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, activity);
 
    return activity;
}

// helper
function __createBlock(scope) {
    var block = SysmlFactory.eINSTANCE.create(Metamodel.sysml.SysMLBlock);
    block.typeCode = "Generic";
    block.name = "new block";
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.sysml.SysMLBlock.the_owned_elements;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, block);
 
    return block;
}

// helper
function __createPort(scope) {
    var port = SysmlFactory.eINSTANCE.create(Metamodel.sysml.SysMLFlowPort);
    port.name = "new port";
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.sysml.SysMLBlock.the_owned_elements;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, port);
 
    return port;
}


// helper
function __createPortUsage(scope) {
  var port = SysmlFactory.eINSTANCE.create(Metamodel.sysml.SysMLFlowPortUsage);
  port.name = "new port usage";

  // XXX changing containment is not supported in 3.1.0 API
  var feature = Metamodel.sysml.SysMLPart.the_owned_elements;
  MediniModelModificationUtil.addValueOfFeature(scope, feature, port);

  return port;
}

// helper
function __createConnector(source, target) {
	// this command does everything we need in a static call
	var connector = SysMLConnectorCreateCommand.createConnector(source, target);
	return connector;
}

// helper
function __createDependency(source, target) {
	// this command does everything we need in a static call
	var connector = SysMLDependencyCreateCommand.createConnector(source, target);
	return connector;
}

// helper
function __createAbstraction(source, target) {
    // create one
    var op = new AnalyzeSystemAllocateOperation(source, java.util.Collections.singletonList(target));
    op.execute(null, null);
    // unfortunately that one will not give us the result
    return SysMLModelUtils.findDependency(source, target,
		Metamodel.sysml.SysMLAbstraction.instanceClass, "allocate");
}

// helper
function __createRequirementsModel(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new CreateSafetyGoalModelOperation("", scope);
    op.execute(null, null);
    return op.getNewModel();
}

// helper
function __createSafetyRequirement(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddSafetyRequirementOperation(scope, null);
    op.clientExecute(null);
    return op.getSafetyRequirement();
}

// helper
function __createSafetyGoal(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddSafetyGoalOperation(scope, null);
    op.clientExecute(null);
    return op.getSafetyGoal();
}

// helper
function __createFailureCollection(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    // var op = new CreateNewFailureCollectionOperation("", Metamodel.safetyModel.Hazard, scope);
    var op = new CreateNewFailureCollectionOperation("", Metamodel.safetyModel.Error, scope);
    op.execute(null, null);
    return op.getNewModel();
}
 
// helper
function __createFailureMode(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddFailureModeOperation(scope, null);
    op.clientExecute(null);
    return op.getFailureMode();
}
 
// helper
function __createMalfunction(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddMalfunctionOperation(scope, null);
    op.clientExecute(null);
    return op.getMalfunction();
}

// helper
function __createHazard(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddHazardOperation(scope, null);
    op.clientExecute(null);
    return op.getHazard();
}

// helper
function __createError(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddErrorOperation(scope, null);
    op.clientExecute(null);
    return op.getError();
}

/**
 * 
 * @param scope the {PJScope} parent
 * @returns the newly created {MeasureCatalog}
 * @since 2017-09-13
 */
function __createMeasureCatalog(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new CreateNewMeasureCatalogOperation("", Metamodel.safetyModel.Measure, scope);
    op.execute(null, null);
    return op.getNewModel();
}

// helper
function __createMeasure(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddMeasureOperation(scope, null);
    op.clientExecute(null);
    return op.getMeasure();
}
 
// helper
function __createMeasureGroup(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    var measureGroup = SafetyModelFactory.eINSTANCE.create(Metamodel.safetyModel.MeasureGroup);
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.safetyModel.Failure.measureGroups;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, measureGroup);
    // console.log("Added measure group to ''{0}''", scope.name);
    return measureGroup;
}

/**
 * @param scope the {MeasureCatalog} parent
 * @returns the newly created {SafetyMechanism}
 * @since 2017-09-13
 */
function __createSafetyMechanism(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddSafetyMechanismOperation(scope, null /* no name */);
    op.clientExecute(null);
    return op.getSafetyMechanism();
}

// helper
function __createFMEAWorksheet(scope) {
	if (!scope) {
		console.error("Scope is undefined in create method!");
	}
	
	// create one
	var op = new CreateFMEAWorksheetOperation("", scope);
	op.execute(null, null);
	return op.getNewModel();
}

// helper
function __createRecommendedAction(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    var action = FMEAFactory.eINSTANCE.create(Metamodel.FMEA.RecommendedAction);
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.FMEA.MeasureEntry.recommendedActions;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, action);
    return action;
}
 
// helper
function __createTakenAction(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    var entry = FMEAFactory.eINSTANCE.create(Metamodel.FMEA.TakenAction);
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.FMEA.RecommendedAction.takenActions;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, entry);
    return entry;
}
 
// helper
function __createCurrentDesignControl(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    var entry = FMEAFactory.eINSTANCE.create(Metamodel.FMEA.CurrentDesignControl);
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.FMEA.CauseEntry.currentDesignControls;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, entry);
    return entry;
}
 
// helper
function __createFailureEntry(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    var entry = FMEAFactory.eINSTANCE.create(Metamodel.FMEA.FailureEntry);
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.FMEA.ComponentEntry.failureModes;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, entry);
    return entry;
}
 
// helper
function __createDCFailureModeEntry(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    var entry = DCFactory.eINSTANCE.create(Metamodel.dc.DCFailureModeEntry);
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.FMEA.ComponentEntry.failureModes;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, entry);
    return entry;
}
 
//helper
function __createHazardAnalysisModel(scope) {
        if (!scope) {
			console.error("Scope is undefined in create method!");
        }
       
        // create one
        var op = new CreateHazardAnalysisModelOperation("", scope, null);
        op.execute(null, null);
        return op.getNewModel();
}
 
// helper
function __createIsoAsil(scope) {
	if (!scope || scope.prototype != Metamodel.hazard.HazardousEvent) {
		console.error("Scope is undefined or wrong in create method!");
	}
	
	var isoAsil = HazardAnalysisFactory.eINSTANCE.create(Metamodel.hazard.IsoAsil);
	var feature = Metamodel.hazard.HazardousEvent.isoAsil;
	MediniModelModificationUtil.setValueOfFeature(scope, feature, isoAsil);

	return isoAsil;
}

// helper
function __createHazardousEvent(scope) {
    var event = HazardAnalysisFactory.eINSTANCE.create(Metamodel.hazard.HazardousEvent);
    event.id = "-";
 
    // XXX changing containment is not supported in 3.1.0 API
    var feature = Metamodel.hazard.HazardAnalysisModel.hazardElements;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, event);
 
    // create nested structures (!)
    var situation = HazardAnalysisFactory.eINSTANCE.create(Metamodel.hazard.OperationalSituation);
    feature = Metamodel.hazard.HazardousEvent.operationalSituation;
    MediniModelModificationUtil.setValueOfFeature(event, feature, situation);
 
	if (__tool_version_number && __tool_version_number < 1930) {
	    var isoAsil = HazardAnalysisFactory.eINSTANCE.create(Metamodel.hazard.IsoAsil);
	    feature = Metamodel.hazard.HazardousEvent.isoAsil;
	    MediniModelModificationUtil.setValueOfFeature(event, feature, isoAsil);
	}

    return event;
}
 
//helper
function __createPackage(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new AddPackageOperation(scope, "");
    op.execute(null, null);
    return op.getNewModel();
}
 
// helper
function __createChecklist(scope, context) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    if (ImportChecklistReviewOperation == undefined) {
        ImportChecklistReviewOperation = bind("de.ikv.analyze.editor.review.checklist", "de.ikv.analyze.editor.review.checklist.handlers.ImportChecklistReviewOperation", false);
    }
 
    // create one
    var op = new ImportChecklistReviewOperation("", scope, "");
    if (context && "handler" in context) {
        op.setHandler(context ? context["handler"] : null);
    }
    op.execute(null, null);
    return op.getNewModel();
}
 
// helper
function __createChecklistItem(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one (ALWAYS CREATE STATIC!)
    var item = ChecklistFactory.eINSTANCE.create(Metamodel.checklist.StaticChecklistItem);
    var feature = Metamodel.checklist.Checklist.items;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, item);
 
    return item;
}
 
// helper
function __createFTAModel(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var op = new CreateFTAModelOperation("", "", scope);
    op.execute(null, null);
    return op.getNewModel();
}
 
// helper
function __createFTAEvent(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var event = FTAFactory.eINSTANCE.create(Metamodel.FTA.Event);
    var feature = Metamodel.FTA.FTAModel.events;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, event);
 
	/*
	 * With 3.4.0 we introduced a separation between Event and EventNode.
	 * Execute conditional code.
	 */
	if (__tool_version_number && __tool_version_number >= 340) {
		feature = Metamodel.FTA.FTAModel.eventNodes;
		var eventFeature = Metamodel.FTA.FTAModel.eventNodes;
		var eventNode = FTAFactory.eINSTANCE.create(Metamodel.FTA.EventNode);
		MediniModelModificationUtil.addValueOfFeature(scope, eventFeature, eventNode);
		eventNode.event = event;
	}

    return event;
}
 
// helper
function __createFTAEventNode(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var eventNode = FTAFactory.eINSTANCE.create(Metamodel.FTA.EventNode);
    var feature = Metamodel.FTA.FTAModel.eventNodes;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, eventNode);
 
    return eventNode;
}

// helper
function __createCustomProbabilityModel(scope, type) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
    if (!type) {
        console.error("Type is undefined in create method!");
    }
 
    // create one
    var model = FTAFactory.eINSTANCE.create(type);
    console.log(model);
    var feature = Metamodel.FTA.Event.probabilityData;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, model);

    return model;
}

// helper
function __createFTALogicalGate(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var gate = FTAFactory.eINSTANCE.create(Metamodel.FTA.LogicalGate);
    var feature = Metamodel.FTA.FTAModel.gates;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, gate);
 
    return gate;
}
 
// helper
function __createFTAVotingGate(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var gate = FTAFactory.eINSTANCE.create(Metamodel.FTA.VotingGate);
    var feature = Metamodel.FTA.FTAModel.gates;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, gate);
 
    return gate;
}
 
// helper
function __createFTATransferGate(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var gate = FTAFactory.eINSTANCE.create(Metamodel.FTA.TransferGate);
    var feature = Metamodel.FTA.FTAModel.gates;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, gate);
 
    return gate;
}
 
// helper
function __createFTAConnection(scope, source, target) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }
 
    // create one
    var connection = FTAFactory.eINSTANCE.create(Metamodel.FTA.Connection);
    var feature = Metamodel.FTA.FTAModel.connections;
    MediniModelModificationUtil.addValueOfFeature(scope, feature, connection);
 
    if (source != undefined && target != undefined) {
        // Note: source is the output!
        connection.inputNode = source;
        connection.outputNode = target;
    }
 
    return connection;
}

// helper
function __createFRVariable(scope) {
    if (!scope) {
        console.error("Scope is undefined in create method!");
    }

	var failureRateData = scope.failureRateData;
	if (failureRateData == null) {
		failureRateData = FailureRateCatalogsFactory.eINSTANCE.create(FailureRateCatalogsPackage.Literals.FAILURE_RATE_DATA);
	    var feature = Metamodel.safetyModel.Failable.failureRateData;
	    MediniModelModificationUtil.setValueOfFeature(scope, feature, failureRateData);
	}

	var newVariable = FailureRateCatalogsFactory.eINSTANCE.create(FailureRateCatalogsPackage.Literals.FR_VARIABLE);
	newVariable.name = "new_variable"; // at least set a name
	newVariable.valueAsString= "0.0"; // at least set initial value
	
    var feature2 = Metamodel.safetyModel.IFailureRateData.userVariables;
    MediniModelModificationUtil.addValueOfFeature(failureRateData, feature2, newVariable);
 
    return newVariable;
}

/**
 * Object Factory()
 * @constructor
 * @since 3.1.0
 * @stability 1 - Experimental
 */
function Factory(){}
Factory.prototype = new Object();
 
/**
* Creates an instance of the given type in the given scope.
* @memberOf Factory
* @param {Object} scope
* @param {EClass} type
* @returns {Object}
* @static
* @see Factory
* @since 3.1.0
* @stability 1 - Experimental
*/ 
 
Factory.createElement = function (scope, type, context) {
    if (!scope) {
        throw "missing mandatory type argument";
    }
    if (!type) {
        throw "missing mandatory type argument";
    }
 
    // SG and SR
    if (type == Metamodel.safetygoals.SafetyRequirementsModel) {
        return __createRequirementsModel(scope);
    }
    if (type == Metamodel.safetygoals.SafetyRequirement) {
        return __createSafetyRequirement(scope);
    }
    if (type == Metamodel.safetygoals.SafetyGoal) {
        return __createSafetyGoal(scope);
    }
 
    // SYSML
    if (type == Metamodel.sysml.SysMLPart) {
        return __createPart(scope);
    }
    if (type == Metamodel.sysml.SysMLActivity) {
        return __createActivity(scope);
    }
    if (type == Metamodel.sysml.SysMLBlock) {
        return __createBlock(scope);
    }
    if (type == Metamodel.sysml.SysMLPort) {
        return __createPort(scope);
    }
    if (type == Metamodel.sysml.SysMLPortUsage) {
        return __createPortUsage(scope);
    }
    if (type == Metamodel.sysml.SysMLContainerPackage) {
        return __createContainerPackage(scope);
    }
 
    // SAFETY
    if (type == Metamodel.safetyModel.MeasureGroup) {
        return __createMeasureGroup(scope);
    }
    if (type == Metamodel.safetyModel.FailureMode) {
        return __createFailureMode(scope);
    }
    if (type == Metamodel.safetyModel.Malfunction) {
        return __createMalfunction(scope);
    }
    if (type == Metamodel.safetyModel.Hazard) {
        return __createHazard(scope);
    }
    if (type == Metamodel.safetyModel.Error) {
        return __createError(scope);
    }
    if (type == Metamodel.safetyModel.Measure) {
        return __createMeasure(scope);
    }
    if (type == Metamodel.safetyModel.FailureCollection) {
        return __createFailureCollection(scope);
    }
    // since 2017-09-13
    if (type == Metamodel.safetyModel.MeasureCatalog) {
        return __createMeasureCatalog(scope);
    }
    // since 2017-09-13
    if (type == Metamodel.safetyModel.SafetyMechanism) {
        return __createSafetyMechanism(scope);
    }
 
    // FMEA
    if (type == Metamodel.FMEA.TakenAction) {
        return __createTakenAction(scope);
    }
    if (type == Metamodel.FMEA.RecommendedAction) {
        return __createRecommendedAction(scope);
    }
    if (type == Metamodel.FMEA.CurrentDesignControl) {
        return __createCurrentDesignControl(scope);
    }
	if (type == Metamodel.FMEA.FMEAWorksheet) {
		return __createFMEAWorksheet(scope);
	}
 
    // DC
    if (type == Metamodel.dc.DCFailureModeEntry) {
        return __createDCFailureModeEntry(scope);
    }
 
    // HARA
    if (type == Metamodel.hazard.HazardousEvent) {
        return __createHazardousEvent(scope);
    }
    if (type == Metamodel.hazard.HazardAnalysisModel) {
        return __createHazardAnalysisModel(scope);
    }
	if (__tool_version_number && __tool_version_number < 1930) {
		// IsoAsil obsolete since 19.3.0
		if (type == Metamodel.hazard.IsoAsil) {
			return __createIsoAsil(scope);
		}
	}
	
    // FTA
    if (type == Metamodel.FTA.FTAModel) {
        return __createFTAModel(scope);
    }
 
    if (type == Metamodel.FTA.Event) {
        return __createFTAEvent(scope);
    }
 
    if (type == Metamodel.FTA.LogicalGate) {
        return __createFTALogicalGate(scope);
    }
 
    if (type == Metamodel.FTA.VotingGate) {
        return __createFTAVotingGate(scope);
    }
 
    if (type == Metamodel.FTA.TransferGate) {
        return __createFTATransferGate(scope);
    }
    
	if (__tool_version_number && __tool_version_number >= 340) {
	    if (type == Metamodel.FTA.ScriptedProbabilityModel) {
	        return __createCustomProbabilityModel(scope, type);
	    }
	    if (type == Metamodel.FTA.ExponentialProbabilityModel) {
	        return __createCustomProbabilityModel(scope, type);
	    }
	    if (type == Metamodel.FTA.NormalProbabilityModel) {
	        return __createCustomProbabilityModel(scope, type);
	    }
	    if (type == Metamodel.FTA.TimeIndependentProbabilityModel) {
	        return __createCustomProbabilityModel(scope, type);
	    }
	    if (type == Metamodel.FTA.WeibullProbabilityModel) {
	        return __createCustomProbabilityModel(scope, type);
	    }
	    if (type == Metamodel.FTA.EventNode) {
	        return __createFTAEventNode(scope);
	    }
	}
 
    // TODO This should be better placed to createRelation(...)
    if (type == Metamodel.FTA.Connection) {
        console.error("Wrong usage of factory method: create connections with createelation");
        return __createFTAConnection(scope);
    }
 
    // CHECKLIST
    if (type == Metamodel.checklist.Checklist) {
        return __createChecklist(scope, context);
    }
 
    if (type == Metamodel.checklist.ChecklistItem) {
        // this is abstract so we create static items always for convenience
        return __createChecklistItem(scope);
    }
    if (type == Metamodel.checklist.StaticChecklistItem) {
        return __createChecklistItem(scope);
    }
 
    // ProjectModel
    if (type == Metamodel.projectmodel.PJPackage) {
        return __createPackage(scope);
    }
 
    // Reliability (HACK! not in Metamodel yet with R19.0)
    if (type == "FRVariable") {
        return __createFRVariable(scope);
    }
 
 
    // not supported
    throw "type is not supported";
};
 
Factory.createRelation = function (source, target, type) {
    if (!source) {
        throw "missing mandatory source argument";
    }
    if (!target) {
        throw "missing mandatory target argument";
    }
    if (!type) {
        throw "missing mandatory type argument";
    }
 
    // HARA
    if (type == Metamodel.safetyModel.FailureRelation) {
        return __createFailureRelation(source, target);
    }
 
    // SG and SR
    if (type == Metamodel.safetygoals.SafetyReqRelation) {
        return __createContributesRelation(source, target);
    }
 
    // FTA
    if (type == Metamodel.FTA.Connection) {
        // the scope is always the FTA model
        return __createFTAConnection(source.model, source, target);
    }
 
    // SysML
    if (type == Metamodel.sysml.SysMLConnector) {
        return __createConnector(source, target);
    }
    // must come first because its inherits from SysMLDependency
    if (type == Metamodel.sysml.SysMLAbstraction) {
        return __createAbstraction(source, target);
    }
    if (type == Metamodel.sysml.SysMLDependency) {
        return __createDependency(source, target);
    }

    // Trace (HACK!)
    if (type == "TRACE") {
        return __createTrace(source, target);
    }
 
    // not supported
    throw "type is not supported";
};
 