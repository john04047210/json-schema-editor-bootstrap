window.JSONSchemaEditor = function(element,options) {
	if (!(element instanceof Element)) {
		throw new Error('element should be an instance of Element');
	}
	options = options||{};
	this.element = element;
	this.options = options;
	this.init();
};

JSONSchemaEditor.prototype = {
	// necessary since we remove the ctor property by doing a literal assignment. Without this
	// the $isplainobject function will think that this is a plain object.
	constructor: JSONSchemaEditor,
	init: function() {
		var self = this;
		var data = this.options.startval || {};

		this.react = ReactDOM.render(
			<SchemaObject onChange={this.onChange} data={data}/>,
			self.element
		);
		this.callbacks = {};
	},
	on: function(event, callback) {
		this.react.on(event, callback);
	},
	onChange: function() {
	},
  getValue: function() {
    return {
      schema: this.getSchema(),
      form: this.getForm()
    }
  },
  getForm: function() {
    return this.react.exportForm();
  },
	getSchema: function() {
		return this.react.export();
	},
	setSchema: function(data) {
		var self = this;
		this.react = ReactDOM.render(
			<SchemaObject onChange={this.onChange} data={data}/>,
			self.element
		);
	}
}

var shortNumberStyle = {
	width: '50px'
}

var SchemaString = React.createClass({
	getInitialState: function() {
		var state = this.props.data;
		state.hasEnum = !!state.enum;
		return state
	},
	componentDidUpdate: function() {
		this.props.onChange();
	},
	export: function(title) {
		return {
			type: 'string',
      title: title,
			format: this.state.format,
			pattern: !!this.state.pattern ? this.state.pattern : undefined,
			enum: this.state.enum
		};
	},
  exportForm: function(title) {
    return {
      key: title,
      type: this.state.format
    };
  },
	change: function(event) {
		this.state[event.target.name] = event.target.value;
		this.setState(this.state);
	},
	changeBool: function(event) {
		this.state[event.target.name] = event.target.checked;
		this.setState(this.state);
	},
	changeEnum: function(event) {
		var arr = event.target.value.split('\n');
		if (arr.length == 1 && !arr[0]) {
			arr = undefined;
		}
		this.state[event.target.name] = arr
		this.setState(this.state);
	},
	render: function() {
	  let inputId = Date.now();
		let settings;
		if (this.state.hasEnum) {
			settings =
        <div className="from-group media-right">
						<label htmlFor={"enum-"+inputId}>Enum (one value per line):</label>
						<textarea rows="3" className="form-control" id={"enum-"+inputId} onChange={this.changeEnum} name="enum" value={(this.state.enum||[]).join('\n')} />
        </div>
		} else {
			settings =
        <div className="form-group media-right">
          <label htmlFor={"pattern-"+inputId}>Pattern:</label>
				  <input name="pattern" type="text" className="form-control" id={"pattern-"+inputId} value={this.state.pattern} onChange={this.change} />
				</div>
		}
		return (
			<div className="form-inline">
        <div className="form-group">
          <label htmlFor={"format-"+inputId}>Format:</label>
          <select name="format" className="form-control" id={"format-"+inputId} onChange={this.change} value={this.state.format}>
            <option value=""></option>
            <option value="color">color</option>
            <option value="date">date</option>
            <option value="datetime">datetime</option>
            <option value="datetime-local">datetime-local</option>
            <option value="email">email</option>
            <option value="month">month</option>
            <option value="number">number</option>
            <option value="range">range</option>
            <option value="tel">tel</option>
            <option value="text">text</option>
            <option value="textarea">textarea</option>
            <option value="time">time</option>
            <option value="url">url</option>
            <option value="week">week</option>
          </select>
        </div>
        <div className="checkbox media-right">
          <label>
            <input name="hasEnum" type="checkbox" checked={this.state.hasEnum} onChange={this.changeBool} /> Enum
          </label>
        </div>
				{settings}
			</div>
		);
	}
});

var SchemaBoolean = React.createClass({
	export: function(title) {
		return {
			type: 'boolean',
      title: title,
			format: 'checkbox'
		}
	},
  exportForm: function(title) {
    return {
      key: title
    };
  },
	render() {
		return (
			<div></div>
		);
	}
})

var SchemaNumber = React.createClass({
	getInitialState: function() {
		return this.props.data;
	},
	componentDidUpdate: function() {
		this.props.onChange();
	},
	change: function(event) {
		this.state[event.target.name] = event.target.value;
		this.setState(this.state);
	},
	export: function(title) {
		var o = JSON.parse(JSON.stringify(this.state));
		o.type = 'number';
		o.title = title;
		delete o.name;
		return o;
	},
  exportForm: function(title) {
    return {
      key: title
    };
  },
	render: function() {
	  let inputId = Date.now();
		return (
			<div className="form-inline">
        <div className="form-group">
          <label htmlFor={"minimum-"+inputId}>Min:</label>
				  <input name="minimum" id={"minimum-"+inputId} className="form-control" type="number" value={this.state.minimum} onChange={this.change} />
        </div>
        <div className="form-group media-right">
          <label htmlFor={"maximum-"+inputId}>Max:</label>
				  <input name="maximum" id={"maximum-"+inputId} className="form-control" type="number" value={this.state.maximum} onChange={this.change} />
        </div>
			</div>
		);
	}
});


var mapping = function(name, data, changeHandler) {
	return {
		string: <SchemaString onChange={changeHandler} ref={name} data={data} />,
		number: <SchemaNumber onChange={changeHandler} ref={name} data={data} />,
		array: <SchemaArray onChange={changeHandler} ref={name} data={data}/>,
		object: <SchemaObject onChange={changeHandler} ref={name} data={data}/>,
		boolean: <SchemaBoolean onChange={changeHandler} ref={name} data={data}/>,
	}[data.type];
};

var SchemaArray = React.createClass({
	getInitialState: function() {
		return this.props.data;
	},
	change: function(event) {
		console.log(this.state)
		if (event.target.type == 'checkbox') {
			this.state[event.target.name] = event.target.checked;
		}
		else if (event.target.name == 'itemtype') {
			this.state.items.type = event.target.value;
		}
		else {
			this.state[event.target.name] = event.target.value;
		}
		this.setState(this.state);
	},
	export: function(title) {
		//console.log(this.refs.items.state)
		return {
			items: this.refs['items'].export(),
			minItems: this.state.minItems,
			maxItems: this.state.maxItems,
			uniqueItems: (this.state.uniqueItems ? true : undefined),
			format: this.state.format,
      title: title,
			type: 'array'
		};
	},
  exportForm: function(title) {
    return {
      key: title
    };
  },
	componentDidUpdate: function() {
		this.onChange();
	},
	onChange: function() {
		this.props.onChange();
	},
 	render: function() {
		let self = this;
		let inputId = Date.now();
		this.state.items = this.state.items || {type: 'string'};
		let optionForm = mapping('items', this.state.items, this.onChange);
		return (
			<div className="row">
        <div className="col-sm-12 col-md-12 col-lg-12">
          <div className="form-inline">
            <div className="form-group">
              <label htmlFor={"itemtype-"+inputId}>Items Type:</label>
              <select name="itemtype" className="form-control" id={"itemtype-"+inputId} onChange={this.change} value={this.state.items.type}>
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="array">array</option>
                <option value="object">object</option>
                <option value="boolean">boolean</option>
              </select>
            </div>
            <div className="form-group media-right">
              <label htmlFor={"minItems-"+inputId}>minItems:</label>
              <input name="minItems" className="form-control" id={"minItems-"+inputId} type="number" onChange={self.change} value={self.state.minItems}  />
            </div>
            <div className="form-group media-right">
              <label htmlFor={"maxItems-"+inputId}>maxItems:</label>
              <input name="maxItems" className="form-control" id={"maxItems-"+inputId} type="number" onChange={self.change} value={self.state.maxItems}  />
            </div>
            <div className="checkbox media-right">
              <label>
                <input name="uniqueItems" type="checkbox" onChange={self.change} checked={self.state.uniqueItems} /> uniqueItems
              </label>
            </div>
            <div className="form-group media-right">
              <label htmlFor={"format-"+inputId}>Format:</label>
              <select name="format" className="form-control" id={"format-"+inputId} onChange={this.change} value={this.state.format}>
                <option value=""></option>
                <option value="table">table</option>
                <option value="checkbox">checkbox</option>
                <option value="select">select</option>
                <option value="tabs">tabs</option>
              </select>
            </div>
          </div>
        </div>
				<div className="col-sm-12 col-md-12 col-lg-12 h6">
					{optionForm}
				</div>
			</div>
		);
	}
});

var SchemaObject = React.createClass({
	getInitialState: function() {
		return this.propsToState(this.props)
	},
	propsToState: function(props) {
		let data = props;
    if(props.hasOwnProperty('data')) {
      data = props.data;
    }
		data.properties = data.properties || {}
		data.required = data.required || [];
		data.propertyNames = [];
		// convert from object to array
		data.properties = Object.keys(data.properties).map(name => {
			data.propertyNames.push(name);
			let item = data.properties[name];
			return item;
		})
		return data
	},
	componentWillReceiveProps: function(newProps) {
		this.setState(this.propsToState(newProps))
	},
	deleteItem: function(event) {
		let i = event.target.parentElement.dataset.index;
		let requiredIndex = this.state.required.indexOf(this.state.propertyNames[i])
		if (requiredIndex !== -1) {
			this.state.required.splice(requiredIndex, 1)
		}
		this.state.properties.splice(i, 1);
		this.state.propertyNames.splice(i, 1);
    this.state = this.propsToState(this.export());
		this.setState(this.state);
	},
	changeItem: function(event) {
    let i = event.target.parentElement.dataset.index;
		if (event.target.name == 'type') {
			this.state.properties[i].type = event.target.value;
		} else if (event.target.name == 'field') {
			this.state.propertyNames[i] = event.target.value;
		}
		this.setState(this.state);
	},
	changeRequired: function(event) {
		if (event.target.checked)
			this.state.required.push(event.target.name);
		else {
			var i = this.state.required.indexOf(event.target.name)
			this.state.required.splice(i, 1);
		}
		this.setState(this.state);
	},
	change: function(event) {
		this.state[event.target.name] = event.target.checked;
		this.setState(this.state);
	},
	changeText: function(event) {
		this.state[event.target.name] = event.target.value;
		this.setState(this.state);
	},
	onChange: function() {
		this.props.onChange()
		this.trigger('change');
	},
	componentDidUpdate: function() {
		this.onChange();
	},
	add: function() {
    this.state = this.propsToState(this.export());
		this.state.properties.push({name: '', type: 'string', title: ''});
		this.setState(this.state);
	},
	export: function() {
    let self = this;
    let properties = {};
		Object.keys(self.state.properties).forEach(index => {
      let name = self.state.propertyNames[index];
			if (typeof self.refs['item'+index] != 'undefined' && name.length > 0) {
        properties[name] = self.refs['item' + index].export(name);
        properties[name].title = name;
      }
		});
		return {
			type: 'object',
			additionalProperties: this.state.additionalProperties,
			format: this.state.format,
			properties: properties,
			required: this.state.required.length ? this.state.required : undefined
		};
	},
  exportForm: function() {
    let self = this;
    let schemaForm = [];
    Object.keys(self.state.properties).forEach(index => {
      let name = self.state.propertyNames[index];
      if (typeof self.refs['item'+index] != 'undefined' && name.length > 0)
        schemaForm.push(self.refs['item'+index].exportForm(name));
    });
    return schemaForm;
  },
	on: function(event, callback) {
		this.callbacks = this.callbacks || {};
		this.callbacks[event] = this.callbacks[event] || [];
		this.callbacks[event].push(callback);

		return this;
	},
	trigger: function(event) {
		if (this.callbacks && this.callbacks[event] && this.callbacks[event].length) {
			for (let i=0; i<this.callbacks[event].length; i++) {
				this.callbacks[event][i]();
			}
		}

		return this;
	},
	render: function() {
    let self = this;

		return (
		<div className="panel panel-default">
      <div className="panel-body">
        {this.state.properties.map((value, index) => {
          var name = self.state.propertyNames[index]
          var copiedState = JSON.parse(JSON.stringify(self.state.properties[index]));
          var optionForm = mapping('item' + index, copiedState, self.onChange);
          return (
            <div key={index}>
              <div className="row">
                <div className="col-sm-12 col-md-12 col-lg-12">
                  <div className="form-inline" data-index={index}>
                    <div className="form-group" data-index={index}>
                      <label className="sr-only" htmlFor={"input_"+index}>input</label>
                      <input name="field" className="form-control" id={"input_"+index} type="string" onChange={self.changeItem} value={name} />
                    </div>
                    <div className="form-group media-right" data-index={index}>
                      <label className="sr-only" htmlFor={"select_"+index}>input</label>
                      <select name="type" className="form-control" id={"select_"+index} onChange={self.changeItem} value={value.type}>
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="array">array</option>
                        <option value="object">object</option>
                        <option value="boolean">boolean</option>
                      </select>
                    </div>
                    <div className="checkbox media-right"><label>
                      <input name={name} type="checkbox" onChange={self.changeRequired} checked={self.state.required.indexOf(name) != -1} /> Required
                    </label></div>
                    <div className="form-group media-right" data-index={index}>
                      <button type="button" id={'btn_'+index} className="btn btn-default" onClick={self.deleteItem} data-index={index}>
                        <span className="glyphicon glyphicon-remove"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row h6">
                <div className="col-sm-12 col-md-12 col-lg-12">
                  {optionForm}
                </div>
              </div>
              <hr className="col-md-10 col-lg-10 h6" />
            </div>
          );
        })}
        <div className="hide">
        Allow additional properties: <input name="additionalProperties" type="checkbox" onChange={self.change} checked={self.state.additionalProperties} />
        Format:
          <select name="format" onChange={this.changeText} value={this.state.format}>
            <option value=""></option>
            <option value="grid">grid</option>
            <option value="schema">schema</option>
          </select>
        </div>

        <button className="btn btn-info navbar-text" onClick={self.add}>Add another field</button>
      </div>
		</div>
	);
  }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = window.JSONSchemaEditor;
