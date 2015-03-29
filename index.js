
var parent=global.ifttt||{};

module.exports={"name":"multi", "triggers":[
{"name":"L'un ou l'autre", fields:[{ "name":"triggers", "displayName":"Evenements"}], "delegate":function(fields){
	var result= function(){
		for(var i=0;i<fields['triggers'].length; i++)
		{
			var trigger=fields['triggers'][i];
			if(parent.loadChannel(trigger.path).find(trigger.name).delegate(trigger.params))
				return true;
		}
		return false;
	};
	result.fields=fields;
	return result;
}},
{"name":"L'un et l'autre", fields:[{ "name":"triggers", "displayName":"Evenements"},{ "name":"timeout", "displayName":"Timeout"}], "when":function(fields, callback){
    var expired=false;
    var completed=[];
    $.each(fields['triggers'], function(index, trigger){
		parent.loadChannel(trigger.path).find(trigger.name).when(trigger.params, function(intemediateResult){
            var timeout=setTimeout(function(){ expired=true; completed[index]=false; }, fields.timeout);
            completed[index]=true;
		    if(!expired && timeout)
		    {
		        clearTimeout(timeout);
		        completed[index]=intermediateResult;
		    }
		});
    });
    
    var test=function(){
        if(!expired)
            callback(result);
        process.nextTick(function(){
            when(fields, callback);
        })
    }
}}
], "actions":[
{"name":"macro", fields:[{ "name":"actions", "displayName":"Evenements"}], "delegate":function(fields, trigger, completed){
	var result= function(){
	    $.eachAsync(fields.actions, function(index, action, next){
			var actionChannel=parent.loadChannel(action.path).find(action.name, 'action');
			if(!ifttt.that(actionChannel.delegate.call(actionChannel, action.params,trigger), action.params, trigger, next))
				return false;
	    }, completed);
	};
	result.fields=fields;
	return result;
}}
]};