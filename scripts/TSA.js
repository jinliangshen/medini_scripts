// $EXPERIMENTAL$ $STRICT_MODE$ $WARNING_AS_ERROR$ $ENHANCED_JAVA_ACCESS$ $ENHANCED_CONTAINMENT_ACCESS$
/*
 * Copyright 2016-2022 ANSYS, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to 
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of 
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS 
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


if (!bind) {
	throw "This script requires extended API";
}

// bind Excel library (NOT OFFICIAL API YET)
var ExcelDocument = bind("de.ikv.medini.docgen.openxml", "de.ikv.medini.docgen.openxml.document.excel.ExcelDocument", false);
var Workbook = bind("de.ikv.medini.docgen.openxml", "de.ikv.medini.docgen.openxml.document.excel.Workbook", false);
var Cell = bind("de.ikv.medini.docgen.openxml", "de.ikv.medini.docgen.openxml.document.excel.Cell", false);
var CellAddress = bind("de.ikv.medini.docgen.openxml", "de.ikv.medini.docgen.openxml.document.excel.CellAddress", false);

load("lib/factory.js");
load("lib/ui.js");
load("lib/trashbin.js");

function toJsStr(javaStr) { return String(javaStr || '').trim(); }


function getCellValue(workSheet,RowIndex,ColumnIndex){
	
	var row = workSheet.getRow(RowIndex);
	if (row !== null && row != undefined) {
		var cellRxCx = row.getCell(ColumnIndex);
	} else {
		cellRxCx = null;
	}
	toJsStr(cellRxCx);

	// console.log("the row is {0} and the column is {1}, and the cell is {2}",RowIndex,ColumnIndex,cellRxCx);
	if (toJsStr(cellRxCx) == "null"){
		cellRxCx = "";
	} 
	else{
		cellRxCx = toJsStr(cellRxCx);
	}

	// var cellRxCx = workSheet.getRow(RowIndex).getCell(ColumnIndex).toString().trim();

	return cellRxCx;
}

function writeDataCell(workSheet,RowIndex,ColumnIndex,cellValue){

	var cellRxCx = workSheet.getRow(RowIndex).getOrCreateCell(ColumnIndex);
	cellRxCx.setType(Cell.Type.STRING);
	cellRxCx.setStringValue(cellValue);
}

function createFailureModeTemplate(signalName, failureModeName, failureType, scope){

	var mediniEntryFailureMode = Factory.createElement(scope, Metamodel.safetyModel.FailureMode);
	mediniEntryFailureMode.name = "The Failure Mode of the signal \"" + signalName + "\" is " + failureModeName;
	mediniEntryFailureMode.failureType = FailureType.PERMANENT; // or TRANSIENT or PERMANENT
	mediniEntryFailureMode.kind = failureType; // or TRANSIENT or PERMANENT
}

function createMalFunctionTemplate(functionName, malfunctionName, scope){

	var mediniEntryMalFunction = Factory.createElement(scope, Metamodel.safetyModel.Malfunction);
	mediniEntryMalFunction.name = "The Malfunction of the function\"" + functionName + "\" is " + malfunctionName;
}

function createPort(targetPart,portInformation,sourcePart){
	// create the port for the uml
	var mediniNewPorts = Factory.createElement(targetPart, Metamodel.sysml.SysMLPortUsage);
	mediniNewPorts.name = portInformation.PortName;
	mediniNewPorts.type = portInformation.Type;
	mediniNewPorts.integrityLevel = portInformation.ASIL;
	switch(toJsStr(portInformation.Direction).toLowerCase()){
		case "in":
			mediniNewPorts.direction = SysMLFlowDirection.IN;		// in, out, inout
			break;
		case "out":
			mediniNewPorts.direction = SysMLFlowDirection.OUT;
			break;
		default:
			mediniNewPorts.direction = SysMLFlowDirection.INOUT;
			break;
	}
	// get the failure mode for the port
	console.log(portInformation.FM);
	if (portInformation.FM){
		var failurModes = portInformation.FM.split(";");
		if (failurModes.length){
			failurModes.map(function(ele) {createFailureModeTemplate(portInformation.PortName,ele.trim(),portInformation.Type,mediniNewPorts);});
			// console.log(failurModes.length);
		}
	}
	// configure the connector
	Factory.createRelation(mediniNewPorts,sourcePart,Metamodel.sysml.SysMLConnector);
}

function createFunction(targetPart,functionInformation){
	// create the function for the uml
	var mediniNewActivitys = Factory.createElement(targetPart, Metamodel.sysml.SysMLActivity);
	mediniNewActivitys.typeCode = "function";	
	mediniNewActivitys.name = functionInformation.PortName;
	mediniNewActivitys.integrityLevel = functionInformation.ASIL;
	// get the failure mode for the port
	var malFunctions = functionInformation.FM.split(";");
	if (malFunctions.length){
		malFunctions.map(function(ele) {createMalFunctionTemplate(functionInformation.PortName,ele,mediniNewActivitys);});
	}
}

function deleteElement(targetPart,medinimodel,portInformation){
	var portsMedini = Global.getFinder(targetPart).findByType(medinimodel).asArray();		
	if (portsMedini.length){
		for (var indexPortsMedini = 0; indexPortsMedini < portsMedini.length; indexPortsMedini++){
			if(portsMedini[indexPortsMedini].name == portInformation.PortName){
				Trashbin.deleteElement(portsMedini[indexPortsMedini]);
				break;
			}
		}
	}
}

function modifyPort(portSourceName,portTargetName,targetPart){
	// modify the port for the uml or modify the function for the uml
	var medifyPorts = {};
	var mediniPorts = Global.getFinder(targetPart).findByType(Metamodel.sysml.SysMLPortUsage).asArray();
	for (var indexModiniPort = 0; indexModiniPort < mediniPorts.length; indexModiniPort++){
		medifyPorts[mediniPorts[indexModiniPort].name] = mediniPorts[indexModiniPort];
	}
	if (medifyPorts[portSourceName]){
		// modify the port name
		medifyPorts[portSourceName].name = portTargetName;
		// modfiy the failure mode of the port
		var sysmlTargetPartPortFailureModes = Global.getFinder(medifyPorts[portSourceName]).findByType(Metamodel.safetyModel.FailureMode).asArray();
		if (sysmlTargetPartPortFailureModes.length){
			var regPatternPort = new RegExp( portSourceName, "g");
			sysmlTargetPartPortFailureModes.map(function(ele) {
				var regPatternPortExitorNot = regPatternPort.test(ele.name);
				if (regPatternPortExitorNot){
					ele.name = ele.name.replace(regPatternPort, portTargetName);
				}
			});
		}
	}
	else{
		alert("The port " + portSourceName + " is not exist in the part " + targetPart.name + ".");
	}
}

function modifyFunction(portSourceName,portTargetName,targetPart){

		// modify the port for the uml or modify the function for the uml
		var medifyPorts = {};
		var mediniPorts = Global.getFinder(targetPart).findByType(Metamodel.sysml.SysMLActivity).asArray();
		for (var indexModiniPort = 0; indexModiniPort < mediniPorts.length; indexModiniPort++){
			medifyPorts[mediniPorts[indexModiniPort].name] = mediniPorts[indexModiniPort];
		}
		if (medifyPorts[portSourceName]){
			// modify the port name
			medifyPorts[portSourceName].name = portTargetName;
			// modfiy the failure mode of the port
			var sysmlTargetPartPortFailureModes = Global.getFinder(medifyPorts[portSourceName]).findByType(Metamodel.safetyModel.Malfunction).asArray();
			if (sysmlTargetPartPortFailureModes.length){
				var regPatternPort = new RegExp( portSourceName, "g");
				sysmlTargetPartPortFailureModes.map(function(ele) {
					var regPatternPortExitorNot = regPatternPort.test(ele.name);
					if (regPatternPortExitorNot){
						ele.name = ele.name.replace(regPatternPort, portTargetName);
					}
				});
			}
		}
		else{
			alert("The port " + portSourceName + " is not exist in the part " + targetPart.name + ".");
		}
}

function main(){
	{
		// find the system safety arcs package
		var systemSafetyArcs = finder.findByType(Metamodel.sysml.SysMLContainerPackage).find("name","TSA").asArray();
		// read the data from the file
		try{
			var file = undefined;
			file = openFile(["*.xlsx", "*.xls","*.xlsm"]);
			if (!file.exists()){
				throw "You don't select the file";
			}
			var sheetNewName = "TSA"; 
			var document = ExcelDocument.open(file,false); // true for read-only
			var workSheetTSA = document.getWorkbook().getWorksheet(sheetNewName);
			if (workSheetTSA){
				var dimWorkSheet = workSheetTSA.getDimension();
				var rowNumWorkSheet = dimWorkSheet.getBottomRight().row;
				var columnNumWorkSheet = dimWorkSheet.getBottomRight().column;

				console.log("the row number of the sheet is {0}", rowNumWorkSheet);

				if (rowNumWorkSheet < 2 || columnNumWorkSheet < 11){
					throw "The format of the TSA is wrong. pls check it.";
				}
				else{
					// analyze the excel-data
					var partsTSA = [];
					var partsSourceTSA = [];
					var portPropertys = [];
					var partsTSAColumnIndex = 1;
					var portNameTSAColumnIndex = 2;
					var modifyNameTSAColumnIndex = 3;
					var directionTSAColumnIndex = 4;
					var typeTSAColumnIndex = 5;
					var asilTSAColumnIndex = 7;
					var failureModeTSAColumnIndex = 8;
					var sourcePartTSAColumnIndex = 9;
					var functionTSAColumnIndex = 10;
					var taskTSAColumnIndex = 11;
					for (var indexParts = 2; indexParts < rowNumWorkSheet + 1; indexParts++){
						partsTSA.push(getCellValue(workSheetTSA,indexParts,partsTSAColumnIndex));
						partsSourceTSA.push(getCellValue(workSheetTSA,indexParts,sourcePartTSAColumnIndex));
						var portProperty = {
							"PortName" 		: getCellValue(workSheetTSA,indexParts,portNameTSAColumnIndex),		
							"ModifyName" 	: getCellValue(workSheetTSA,indexParts,modifyNameTSAColumnIndex),					
							"Direction" 	: getCellValue(workSheetTSA,indexParts,directionTSAColumnIndex),
							"Type" 			: getCellValue(workSheetTSA,indexParts,typeTSAColumnIndex),
							"ASIL" 			: getCellValue(workSheetTSA,indexParts,asilTSAColumnIndex),
							"FM" 			: getCellValue(workSheetTSA,indexParts,failureModeTSAColumnIndex),
							"SrcPart" 		: getCellValue(workSheetTSA,indexParts,sourcePartTSAColumnIndex),
							"Function" 		: getCellValue(workSheetTSA,indexParts,functionTSAColumnIndex),
							"Task" 			: getCellValue(workSheetTSA,indexParts,taskTSAColumnIndex)
						};
						portPropertys.push(portProperty);
					}
					// get the part in medini
					var mediniParts = {};
					var partsMediniExit = Global.getFinder(systemSafetyArcs[0]).findByType(Metamodel.sysml.SysMLPart).asArray();
					for (var indexPartsMediniExit = 0; indexPartsMediniExit < partsMediniExit.length; indexPartsMediniExit++){
						mediniParts[partsMediniExit[indexPartsMediniExit].name] = partsMediniExit[indexPartsMediniExit];
					}
					// get the unique seq
					var partsTSATotal = partsTSA.concat(partsSourceTSA);
					var partsTSAUnique = partsTSATotal.filter(function(ele, idx, self){ return self.indexOf(ele) == idx;});
					// create the part in medini
					if (partsTSAUnique.length){
						for (var indexPartsUnique = 0; indexPartsUnique < partsTSAUnique.length; indexPartsUnique++){
							if(mediniParts[partsTSAUnique[indexPartsUnique]]){
								continue;
							}
							var mediniNewParts = Factory.createElement(systemSafetyArcs[0], Metamodel.sysml.SysMLPart);
							mediniNewParts.name = partsTSAUnique[indexPartsUnique];
							mediniParts[partsTSAUnique[indexPartsUnique]] = mediniNewParts;
						}
					}
					// get the part in medini
					var partsMediniAll = Global.getFinder(systemSafetyArcs[0]).findByType(Metamodel.sysml.SysMLPart).asArray();
					// create the port or function for the uml
					var rowNumForCreate = [];
					partsTSA.forEach(function(ele, idx){
						for (var indexPartsMediniAll = 0; indexPartsMediniAll < partsMediniAll.length; indexPartsMediniAll++){
							if (ele == partsMediniAll[indexPartsMediniAll].name){
								var isPort = toJsStr(portPropertys[idx].Function).toLowerCase().indexOf('port') >= 0;
								switch(toJsStr(portPropertys[idx].Task).toLowerCase()){
									case "create":
										{
											// create the port for the uml or create the function for the uml
											isPort ? createPort(partsMediniAll[indexPartsMediniAll],portPropertys[idx],mediniParts[portPropertys[idx].SrcPart]) : createFunction(partsMediniAll[indexPartsMediniAll],portPropertys[idx]);
											// save the row num for create
											rowNumForCreate.push(idx + 2);
										}
										break;
									case "modify":
										{
											// modify the port for the uml or modify the function for the uml
											isPort ? modifyPort(portPropertys[idx].PortName,portPropertys[idx].ModifyName,partsMediniAll[indexPartsMediniAll]) : modifyFunction(portPropertys[idx].PortName,portPropertys[idx].ModifyName,partsMediniAll[indexPartsMediniAll]);
											// save the row num for create
											rowNumForCreate.push(idx + 2);
										}
										console.log("modify");
										break;
									case "delete":
										{
											// delete the port for the uml or delete the function for the uml
											var metaData = isPort ? Metamodel.sysml.SysMLPortUsage : Metamodel.sysml.SysMLActivity;
											deleteElement(partsMediniAll[indexPartsMediniAll],metaData,portPropertys[idx]);
										}
										break;
									default:
									break;
								}
								break;
							}
						}
					});
				}
			}else{
				throw "Pls create the TSA file firstly.";
			}			
			// change the excel file date property from create to None
			if (rowNumForCreate.length){
				rowNumForCreate.map(function(ele) {
					var taskType = getCellValue(workSheetTSA,ele,taskTSAColumnIndex);
					switch(toJsStr(taskType).toLowerCase()){
						case "modify":
							{
								var targePortName = getCellValue(workSheetTSA,ele,modifyNameTSAColumnIndex);
								writeDataCell(workSheetTSA,ele,portNameTSAColumnIndex,targePortName);
								writeDataCell(workSheetTSA,ele,modifyNameTSAColumnIndex,"");
							}
							break;
						default:
						break;
					}
					writeDataCell(workSheetTSA,ele,taskTSAColumnIndex,"None");
				});
			}
		}
		finally{
			document.close();
			alert('TSA-Create-Completed.');
		}
	}
}

main();
