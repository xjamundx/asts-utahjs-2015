function getPermits(callback) {
	setTimeout(callback, 1.0519e10); // 4 months because trees
}

export function buildHouse(lot, color, size, bedrooms, callback) {
	getPermits((permits) => {
		clearLot(permits, lot);
	let foundation = buildFoundation(size);
	let walls = buildWalls(bedrooms);
	let paintedWalls = paintWalls(color, walls);
	let roof = buildRoof(foundation, walls);
	let house = foundation + paintedWalls + roof;

	// house will be ready in a year
	callback(house);
});
}
