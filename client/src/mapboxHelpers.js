export const makeRectangleBuffer = (map, point, buffer, isLngLat=false, isBbox=false) => {
    if (isBbox) {
        const start = isLngLat ? Object.values(map.unproject({x: point.x - buffer, y: point.y - buffer})) : [point.x - buffer, point.y - buffer];
        const end = isLngLat ? Object.values(map.unproject({x: point.x + buffer, y: point.y + buffer})) : [point.x + buffer, point.y + buffer];
        return [start, end];
    } else {
        const x0 = point.x - buffer;
        const x1 = point.x + buffer;
        const y0 = point.y - buffer;
        const y1 = point.y + buffer;
        const p1 = Object.values(map.unproject({x: x0, y: y0}));
        const p2 = Object.values(map.unproject({x: x0, y: y1}));
        const p3 = Object.values(map.unproject({x: x1, y: y1}));
        const p4 = Object.values(map.unproject({x: x1, y: y0}));
        return [p1, p2, p3, p4, p1];
    }
}