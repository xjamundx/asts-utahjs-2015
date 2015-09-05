export function buildHouse(lot, color, size, bedrooms) {
	clearLot(lot);
	let foundation = buildFoundation(size);
	let walls = buildWalls(bedrooms);
	let paintedWalls = paintWalls(color, walls);
	let roof = buildRoof(foundation, walls);
	let house = foundation + paintedWalls + roof;

	// house is all done right-away
	return house;
}
