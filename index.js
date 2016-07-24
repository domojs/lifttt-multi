var parent=global.ifttt||{};
var debug=$('debug')('ifttt:multi');

module.exports={"name":"multi", "triggers":[
{"name":"L'un ou l'autre", fields:[{ "name":"triggers", "displayName":"Evenements"}], when:function(fields, callback){
	$.each(fields.triggers, function(i, trigger)
	{
	    debug(trigger.path, trigger.name);
		parent.loadChannel(trigger.path).find(trigger.name).when(trigger.params, function(result){
            callback(result);
		});
	});
}},
{"name":"L'un et l'autre", fields:[{ "name":"triggers", "displayName":"Evenements"},{ "name":"timeout", "displayName":"Timeout"}], when:function(fields, callback){
    var expired=false;
    var completed=[];
    var lastCompleted=[];
    var timeout=0;
    $.each(fields.triggers, function(index, trigger){
        parent.loadChannel(trigger.path).find(trigger.name).when(trigger.params, function(intermediateResult){
            if(!timeout)
                timeout=setTimeout(function(){ expired=true; }, fields.timeout);
            completed[index]=true;
            lastCompleted[index]=intermediateResult;
            debug('trigger ',trigger.name, '(',trigger.path,') finished with ',intermediateResult);
            if(!expired && timeout)
            {
                completed[index]=intermediateResult;
                debug(lastCompleted);
                if($.grep(lastCompleted, function(value){
                    return !value;
                }).length==0 && completed.length==fields.triggers.length)
                {
                    clearTimeout(timeout);
                    var result={};
                    callback($.extend.apply(result, lastCompleted, completed));
                    
                    if(timeout)
                        clearTimeout(timeout);
                    completed=[];
                    timeout=false;
                }
            }
            else
            {
                if(timeout)
                    clearTimeout(timeout);
                completed=[];
                timeout=setTimeout(function(){ expired=true; }, fields.timeout);
            }
        });
    });
}}
], "actions":[
{"name":"macro", fields:[{ "name":"actions", "displayName":"Actions"}], "delegate":function(fields, trigger, completed){
	var result= function(fields, trigger, completed){
	    $.eachAsync(fields.actions, function(index, action, next){
			var actionChannel=ifttt.loadChannel(action.path);
	        var action=actionChannel.find(action.name, 'action').delegate.call(actionChannel, action.params);
	
			if(!ifttt.that(action, fields, trigger, next))
				return false;
	    }, completed);
	};
	result.fields=fields;
	return result;
}}
],
"conditions":[
{"name":"and", fields:[{ "name":"conditions", "displayName":"Conditions"}], "evaluate":function(params){
    var conditions=[];    
    $.each(params.conditions, function(index, condition){
        var conditionChannel=parent.loadChannel(condition.path);
		var conditionF=conditionChannel.find(condition.name, 'condition');
		conditions.push(conditionF.evaluate.call(conditionChannel, condition.params));
    });
	return function(triggerFields, callback){
	    var result=true;
	    $.eachAsync(conditions, function(index, condition, next){
	        if(!result)
	            next();
	        condition(triggerFields, function(intermediateResult){
	            result=result && intermediateResult;
                next();
	        });
	    }, function(){
            callback(result);
	    });
	};
}}
]};