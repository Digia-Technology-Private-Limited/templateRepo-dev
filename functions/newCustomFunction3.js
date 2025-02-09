/*
Update your Function name
Function can only have one paramater. 
All arguments passed in js.eval('fnName', arg1, arg2) are converted to an array. 
*/
function newCustomFunction3(data) { 

  //read values from incoming data
  var arg1 = data[0];
  var arg2 = data[1];
  console.log("arg1: ", arg1, " arg2: ", arg2)

  //add your code here
  let result = arg1 + arg2;
  
  //return values after processing
  return result;
}