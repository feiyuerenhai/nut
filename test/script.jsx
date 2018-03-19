import a from './a.js';

import b from './mod/b.js';

import React, {Component} from 'react';

import ReactDOM from 'react-dom';

class A extends Component{
	render(){
		return <div>hey</div>
	}
}

ReactDOM.render(<A/>, document.getElementById('app'));