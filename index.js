
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
{"name":"L'un et l'autre", fields:[{ "name":"triggers", "displayName":"Evenements"},{ "name":"timeout", "displayName":"Timeout"}], when:function(fields, callback){
    var expired=false;
    var completed=[];
    var timeout=0;
    $.each(fields.triggers, function(index, trigger){
        parent.loadChannel(trigger.path).find(trigger.name).when(trigger.params, function(intermediateResult){
            if(!timeout)
                timeout=setTimeout(function(){ expired=true; }, fields.timeout);
            completed[index]=true;
            if(!expired && timeout)
            {
                clearTimeout(timeout);
                completed[index]=intermediateResult;
                if($.grep(completed, function(value){
                    return !value;
                }).length==0 && completed.length==fields.triggers.length)
                {
                    var result={};
                    callback($.extend.apply(result, completed));
                    completed=[];
                    timeout=setTimeout(function(){ expired=true; }, fields.timeout);
                }
            }
            else
            {
                completed=[];
                timeout=setTimeout(function(){ expired=true; }, fields.timeout);
            }
        });
    });
}}
], "actions":[
{"name":"macro", fields:[{ "name":"actions", "displayName":"Evenements"}], "delegate":function(fields, trigger, completed){
	var result= function(){
	    $.eachAsync(fields.actions, function(index, action, next){
			var actionChannel=parent.loadChannel(action.path).find(action.name, 'action');
			if(!ifttt.that.call(actionChannel.delegate.call(actionChannel, action.params,trigger), action.params, trigger, next))
				return false;
	    }, completed);
	};
	result.fields=fields;
	return result;
}}
]};