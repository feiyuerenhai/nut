module.exports = class StampedMap {
	constructor(map = new Map(), stamps = new Map()) {
		this._map = map;
		this._stamps = stamps;
	}
	stamped(key, stamp){
		return `${key}$${stamp}`;
	}
	update(key, stamp){
		this._stamps.set(key, stamp);
		return stamp;
	}
	set(key, stamp, value){
		stamp = this.update(key, stamp);
		const key$stamp = this.stamped(key, stamp);
		this._map.set(key$stamp, value);
		return value;
	}
	get(key){
		const stamp = this._stamps.get(key);
		if(!stamp)return null;
		const key$stamp = this.stamped(key, stamp);
		return this._map.get(key$stamp);
	}
};