/*
 * Copyright (c) 2016 ANSYS medini Technologies AG
 * All rights reserved.
 * 
 * The script is provided "as is" without warranty of any kind. 
 * ANSYS medini Technologies AG disclaims all warranties, either express or implied, 
 * including the warranties of merchantability and fitness for a particular purpose.
 * 
 * v2018-08-28 - alertWithToggle and alertWithAbortOption added
 * v2018-07-17 - copyToClipboard and copyFromClipboard added
 * v2018-04-12 - openDirectory added
 * v2016-11-14 - initial version
 */
if (!bind) {
	throw "This script requires extended API";
}

// bind UI utility (NOT OFFICIAL API YET)
var UI = bind("de.ikv.medini.util.eclipse", "de.ikv.medini.util.eclipse.MediniUIUtil", false);
var AnalyzeUI = bind("de.ikv.analyze.ui.common", "de.ikv.analyze.ui.common.util.AnalyzeUIUtil", false);
var Dialogs = bind("de.ikv.medini.util.eclipse", "de.ikv.medini.util.eclipse.dialogs.MediniDialogUtil", false);
var SelectElementTreeDialog = bind("de.ikv.medini.cockpit.ui", "de.ikv.medini.cockpit.ui.dialogs.SelectModelElementTreeDialog", false);
var SWT = bind("org.eclipse.swt", "org.eclipse.swt.SWT", false);
var SWTPoint = bind("org.eclipse.swt", "org.eclipse.swt.graphics.Point", false);
var SWTButton = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Button", false);
var DirectoryDialog = bind("org.eclipse.swt", "org.eclipse.swt.widgets.DirectoryDialog", false);
var InputDialog = bind("org.eclipse.jface", "org.eclipse.jface.dialogs.InputDialog", false);
var StructuredSelection = bind("org.eclipse.jface", "org.eclipse.jface.viewers.StructuredSelection", false);
var ArrayTreeContentProvider = bind("de.ikv.medini.util.eclipse", "de.ikv.medini.util.eclipse.jface.viewers.ArrayTreeContentProvider", false);
var VanillaAction = bind("de.ikv.medini.util.eclipse", "de.ikv.medini.util.eclipse.jface.action.VanillaAction", false);
var WidgetUtil = bind("de.ikv.medini.util.swt", "de.ikv.medini.util.swt.widgets.WidgetUtil", false);
var ScopedPreferenceStore = bind("org.eclipse.ui.workbench", "org.eclipse.ui.preferences.ScopedPreferenceStore", false);
var InstanceScope = bind("org.eclipse.equinox.preferences", "org.eclipse.core.runtime.preferences.InstanceScope", false);


var Label  = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Label", false);
var RowLayout = bind("org.eclipse.swt", "org.eclipse.swt.layout.RowLayout", false);
var swText  = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Text", false);
var GridData = bind("org.eclipse.swt", "org.eclipse.swt.layout.GridData", false);
var Composite = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Composite", false);
var SelectionAdapter = bind("org.eclipse.swt", "org.eclipse.swt.events.SelectionAdapter", false);
var TitleAreaDialog = bind("org.eclipse.jface", "org.eclipse.jface.dialogs.TitleAreaDialog", false);
var Dialog = bind("org.eclipse.jface", "org.eclipse.jface.dialogs.Dialog", false);
var uiWindow = bind("org.eclipse.jface", "org.eclipse.jface.window.Window", false);
var Table = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Table", false);
var TableItem = bind("org.eclipse.swt", "org.eclipse.swt.widgets.TableItem", false);
var Shell = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Shell", false);
var Display = bind("org.eclipse.swt", "org.eclipse.swt.widgets.Display", false);
var GridLayout = bind("org.eclipse.swt", "org.eclipse.swt.layout.GridLayout", false);

function openFile(extensions) {
	var fileName = undefined;
	UI.execute(function select(monitor) {
		var shell = UI.getWorkbenchWindowShell();
		fileName = Dialogs.openFileDialog(shell, SWT.OPEN, extensions);
	});
		
	if (fileName) {
		return new java.io.File(fileName);
	}
	return undefined;
}

function openDirectory(message, filterPath) {
	var dirName = undefined;
	UI.execute(function select(monitor) {
		var shell = UI.getWorkbenchWindowShell();
		var dialog = new DirectoryDialog(shell);
		if (message) {
			dialog.setMessage(message);
		}
		if (filterPath && typeof initial === 'string') {
			filterPath = new java.io.File(filterPath);
		}
		if (filterPath) {
			dialog.setFilterPath(filterPath.getParent());
		}
		dirName = Dialogs.openDirectoryDialog(dialog);
	});
		
	if (dirName) {
		return new java.io.File(dirName.trim());
	}
	return undefined;
}

/*
 * Opens the editor for the given semantic element.
 */
function openEditor(semanticElement, delay) {
	var openFunc = function open(monitor) {
		AnalyzeUI.INSTANCE.openEditorForSemanticElement(semanticElement, true,
				false, false, true);
	};
	
	if (delay != undefined) {
		UI.executeDelayed(delay, openFunc);
	} else {
		UI.executeNonBlocking(openFunc);
	}
}

/*
 * It is rather difficult to decide whether a given object 
 * is an array with Rhino.
 */
function isArray(object) {
	if (object == undefined) {
		return false;
	}
	if (typeof object != "object") {
		return false;
	}
	if (object.length == undefined) {
		return false;
	}
	if (typeof object.length != "number") {
		return false;
	}
	
	return true;
}

/**
 * Opens an element selection dialog, either single selection or multi-selection. 
 * An optional root element can be passed.
 * 
 * @param {String} title
 * @param {EClass} type
 * @param {Boolean} multiple
 * @param {Object} root
 * @returns a single object or an array of objects or undefined
 */
function selectElement(title, type, multiple, root) {
	var selected = undefined;
	UI.execute(function select(monitor) {
		var shell = UI.getWorkbenchWindowShell();
		var dialog = new SelectElementTreeDialog(shell, title, type, multiple);
		AnalyzeUI.INSTANCE.preparate(dialog);
		dialog.setStyle(SelectElementTreeDialog.CHECKBOX);
		if (multiple) {
			dialog.setStyle(SelectElementTreeDialog.PROPAGATE_CHECKED_STATE);
		}
		// use global variable "project" as input if none was defined
		if (root == undefined) {
			root = finder.getProject();
		} else if (isArray(root)) {
			dialog.setTreeContentProvider(new ArrayTreeContentProvider());
			dialog.clearStyle(1 << 12); // <- filter does not work in this case
		}
		dialog.setTreeInput(root);
		var result = Dialogs.openDialog(dialog);
		
		if (result == 0) { // Window.OK = 0
			selected = dialog.getSelectedModelElements();
			if (!multiple) {
				selected = selected[0];
				// FIXME This should be normally done by the dialog already, why isn't?
				if (selected.prototype == Metamodel.projectmodel.PJProxyModel) {
					selected = selected.originalModel;
				}
			}
		}
	});
		
	return selected;
}

/*
 * Input filter which accepts all.
 */
function acceptAll(input) {
	return null;
}

function inputText(title, message, initialValue, validator) {
	var selected = undefined;
	if (validator == undefined) {
		validator = acceptAll;
	}
	UI.execute(function select(monitor) {
		var shell = UI.getWorkbenchWindowShell();
		var dialog = new InputDialog(shell, title, message, initialValue,
				validator);
		var result = dialog.open();
		if (result == 0) { // Window.OK = 0
			selected = dialog.getValue();
		}
	});

	return selected;
}

/**
 * Opens an option dialog with a message and buttons for each option.
 * 
 * @param {String} title
 * @param {String} message
 * @param [{String}] options an array of strings aka options
 * @returns the index of the selected option or -1 (cancel)
 */
function selectOption(title, message, buttons) {
	// API says: "can be called from any thread" but not true
	// TODO assert that buttons is an array
	var selected = -1;
	UI.execute(function select(monitor) {
		selected = UI.displayQuestion(title, message, buttons);
	});
	
	return selected;
}

function runHandler(handler, object, label) {
	// use a vanilla action to satisfy the handler
	var action = new VanillaAction(label);
	// we have to run in UI thread
	UI.execute(function run(monitor) {
		// simulate a selection
		handler.selectionChanged(action, new StructuredSelection(object));
		handler.run(action);
	});
}

function setHandlerSelection(handler, object, label) {
	// use a vanilla action to satisfy the handler
	var action = new VanillaAction(label ? label : "set selection");
	handler.selectionChanged(action, new StructuredSelection(object));
}

/**
 * Helper to fill the text into the system Clipboard.
 * 
 * @param {String}
 *            text to copy to the Clipboard
 * 
 */
function copyToClipboard(text) {
	var toolkit = java.awt.Toolkit.getDefaultToolkit();
	var clipboard = toolkit.getSystemClipboard();
	var transfer = new java.awt.datatransfer.StringSelection(text);
	clipboard.setContents(transfer, null);
}

/**
 * Helper to extract text from the system Clipboard.
 * 
 * @return {String} text if the Clipboard contains text, otherwise the result is
 *         undefined
 */
function copyFromClipboard() {
	var toolkit = java.awt.Toolkit.getDefaultToolkit();
	var clipboard = toolkit.getSystemClipboard();
	return clipboard.getData(java.awt.datatransfer.DataFlavor.stringFlavor);
}

/**
 * Opens a message dialog similar to "alert" but with a typical "Do not show
 * again" toggle.
 * 
 * @param {String}
 *            message
 * @param {Object}
 *            an optional object (map) that holds information on kind, title
 * @returns 0 (OK) or 1 (CANCEL)
 */
function alertWithToggle(message, options) {
	if (options == undefined) {
		options = {};
	}
	var kind = options["kind"];
	var title = options["title"];
	var toggleMessage = options["toggleMessage"];
	var bundleName = options["bundleName"];
	var key = options["key"];
	var style = options["style"];
	
	if (kind == undefined) {
		kind = 2; // INFO
	}
	if (title == undefined) {
		title = "Alert";
	}
	if (toggleMessage == undefined) {
		toggleMessage = "Do not show this message again";
	}
	if (bundleName == undefined) {
		bundleName = "de.ikv.medini.util.eclipse";
	}
	if (key == undefined) {
		key = message;
	}
	if (style == undefined) {
		style = SWT.NONE;
	}
		
	var store = new ScopedPreferenceStore(InstanceScope.INSTANCE, bundleName);
	var selected = undefined;
	UI.execute(function select(monitor) {
		var shell = UI.getWorkbenchWindowShell();
		selected = Dialogs.openDialogWithDontShowAgainToggle(kind, shell, title, message, toggleMessage, store, key, style);
		store.save();
	});
	
	return selected;
}

/**
 * Opens a message dialog similar to "alert" but allows the user to choose
 * whether or not to abort the program completely. Returns <code>true</code>
 * if "Abort" and <code>false</code> if "Continue" has been selected.
 * <strong>Note: It is up to the caller to evaluate this and abort the program,
 * if the user has opted so.</strong>
 * 
 * @param {String}
 *            message
 * @returns <code>false</code> if the user has selected to continue,
 *          <code>true</code> if the user has selected to abort
 */
function alertWithAbortOption(message) {
	var selected = selectOption("Alert", message , [ "Continue", "Abort" ]);
	if (selected == 1) {
		return true;
	} else {
		return false;
	}
}


/**
 * Opens a given object in the external browser. The following types are 
 * supported: java.io.File and string.
 * 
 * @param object URL string or File object
 */
function openInExternalBrowser(object) {
	if (object instanceof java.io.File) {
		object = object.toURL();
	}
	var url = '' + object; // make a string out of it
	AnalyzeUI.INSTANCE.openInExternalBrowser(url);
}
