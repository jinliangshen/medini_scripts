/* 
 * Copyright (c) 2017-2018 ANSYS medini Technologies AG
 * All rights reserved.
 * 
 * The script is provided "as is" without warranty of any kind. 
 * ANSYS medini Technologies AG disclaims all warranties, either express or implied, 
 * including the warranties of merchantability and fitness for a particular purpose.
 * 
 * v2018-01-15 - fail safe when deleting same object multiple times
 * v2017-09-13 - initial version
 */
if (!bind) {
	throw "This script requires extended API";
}

// bind operations (NOT OFFICIAL API YET)
var DeleteElementOperation = bind("de.ikv.analyze.core",
		"de.ikv.analyze.core.operations.DeleteElementOperation", false);

var TraceQuickLinkHandler = bind("de.ikv.analyze.ui",
		"de.ikv.analyze.ui.handlers.TraceQuickLinkHandler", false);

var VanillaAction = bind("de.ikv.medini.util.eclipse",
		"de.ikv.medini.util.eclipse.jface.action.VanillaAction", false);

var StructuredSelection = bind("org.eclipse.jface",
		"org.eclipse.jface.viewers.StructuredSelection", false);

var ExecutionEvent = bind("org.eclipse.core.commands",
		"org.eclipse.core.commands.ExecutionEvent", false);

var EvaluationContext = bind("org.eclipse.core.expressions",
		"org.eclipse.core.expressions.EvaluationContext", false);

var MediniProjectModelUtil = bind("de.ikv.medini.metamodel.projectmodel",
		"de.ikv.medini.metamodel.projectmodel.util.MediniProjectModelUtil", false);

var MediniEMFUtil = bind("de.ikv.medini.util.emf.plugin",
		"de.ikv.medini.util.emf.MediniEMFUtil", false);

/**
 * Object Trashbin()
 * 
 * @constructor
 * @since 3.1.0
 * @stability 1 - Experimental
 */
function Trashbin() {}
Trashbin.prototype = new Object();

/**
 * Returns <code>true</code> if the given element is for sure a top level
 * element in the sense, that it is hooked into the overall project model using
 * a PJProxy. In all other cases it returns false.
 * 
 * @param {Object}
 *            element
 * @returns <code>true</code> if this is a top level element
 */
Trashbin.isTopLevelElement = function(element) {
	if (element.prototype == Metamodel.safetygoals.SafetyRequirementsModel) {
		return true;
	}
	if (element.prototype == Metamodel.hazard.PlainItem) {
		return true;
	}
	if (element.prototype == Metamodel.hazard.HazardAnalysisModel) {
		return true;
	}
	if (element.prototype == Metamodel.FTA.FTAModel) {
		return true;
	}
	if (element.prototype == Metamodel.FMEA.FMEAWorksheet) {
		return true;
	}
	if (element.prototype == Metamodel.dc.DCWorksheet) {
		return true;
	}
	if (element.prototype == Metamodel.safetyModel.MeasureCatalog) {
		return true;
	}
	if (element.prototype == Metamodel.safetyModel.FailureCollection) {
		return true;
	}
	if (element.prototype == Metamodel.checklist.Checklist) {
		return true;
	}
	if (element.prototype == Metamodel.sysml.SysMLContainerPackage) {
		throw "elements of this type cannot be deleted - not supported";
	}
	if (element.prototype == Metamodel.Simulink.Configuration) {
		throw "elements of this type cannot be deleted - not supported";
	}
	
	return false;
};

Trashbin.deleteElement = function(element) {
	if (!element) {
		throw "missing element for deletion";
	}

	// at this stage we shall check whether the object is inside an editing domain
	if (MediniEMFUtil.getEditingDomain(element) == undefined) {
		// silently return
		return;
	}
	
	// add some paranoia here
	if (element.prototype == Metamodel.FTA.Event) {
		throw "pure Event objects cannot be deleted, only EventNode objects";
	}
	
	// all top level objects need special attention
	if (Trashbin.isTopLevelElement(element)) {
		element = MediniProjectModelUtil.findPJProxyModel(element);
		if (element == null) {
			throw "this object seems to be outside the containment hirarchy already";
		}
	}
	
	var op = new DeleteElementOperation(element, "");
	op.clientExecute(null);
};

Trashbin.deleteRelation = function(source, target, type) {
    if (!source) {
        throw "missing mandatory source argument";
    }
    if (!target) {
        throw "missing mandatory target argument";
    }
    if (!type) {
        throw "missing mandatory type argument";
    }

    // Trace (HACK!)
    if (type == "TRACE" || type == Metamodel.traceability.Trace) {
    	var action = new VanillaAction("Delete Trace");
    	var selection = new StructuredSelection([source, target]);
    	var context = new EvaluationContext(null, selection);
    	context.addVariable("selection", selection);
    	var params = new java.util.HashMap();
    	params["traceLink.inverse"] = "true";
    	var event = new ExecutionEvent(null, params, null, context);
    	
    	var handler = new TraceQuickLinkHandler();
    	handler.selectionChanged(action, selection);
    	handler.execute(event);
    	return;
    }
 
    // not supported
    throw "type is not supported";
};