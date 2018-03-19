module.exports = class StampedMap {
	constructor(map = new Map(), stamps = new Map()) {
		this._map = map;
		this._stamps = stamps;
	}
	_stampe(key, stamp){
		return `${key}$${stamp}`;
	}
	getStamp(key){
		return this._stamps.get(key);
	}
	setStamp(key, stamp){
		this._stamps.set(key, stamp);
		return stamp;
	}
	set(key, stamp, value){
		stamp = this.setStamp(key, stamp);
		const key$stamp = this._stampe(key, stamp);
		this._map.set(key$stamp, value);
		return value;
	}
	get(key){
		const stamp = this._stamps.get(key);
		if(!stamp)return null;
		const key$stamp = this._stampe(key, stamp);
		return this._map.get(key$stamp);
	}
};