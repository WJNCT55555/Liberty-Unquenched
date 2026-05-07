import * as d3 from 'd3';

export function parliament() {
    /* params */
    let width: number;
    let height: number;
    let innerRadiusCoef = 0.4;

    /* animations */
    const enter = {
        "smallToBig": true,
        "fromCenter": true
    };
    const update = {
        'animate': true,
    };
    const exit = {
        "bigToSmall": true,
        "toCenter": true
    };

    /* events */
    const parliamentDispatch = d3.dispatch("click", "dblclick", "mousedown", "mouseenter",
        "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "touchcancel", "touchend",
        "touchmove", "touchstart");

    function parliamentFn(data: any) {
        data.each(function(this: any, d: any) {
            // if user did not provide, fill the svg:
            width = width ? width : this.getBoundingClientRect().width;
            height = width ? width / 2 : this.getBoundingClientRect().width / 2;

            const outerParliamentRadius = Math.min(width / 2, height);
            const innerParliementRadius = outerParliamentRadius * innerRadiusCoef;

            /* init the svg */
            const svg = d3.select(this);

            /***
             * compute number of seats and rows of the parliament */
            let nSeats = 0;
            d.forEach(function(p: any) { nSeats += (typeof p.seats === 'number') ? Math.floor(p.seats) : p.seats.length; });

            let nRows = 0;
            let maxSeatNumber = 0;
            let b = 0.5;
            (function() {
                const a = innerRadiusCoef / (1 - innerRadiusCoef);
                while (maxSeatNumber < nSeats) {
                    nRows++;
                    b += a;
                    maxSeatNumber = series(function(i: number) { return Math.floor(Math.PI * (b + i)); }, nRows - 1);
                }
            })();

            /***
             * create the seats list */
            const rowWidth = (outerParliamentRadius - innerParliementRadius) / nRows;
            const seats: any[] = [];
            (function() {
                const seatsToRemove = maxSeatNumber - nSeats;
                for (let i = 0; i < nRows; i++) {
                    const rowRadius = innerParliementRadius + rowWidth * (i + 0.5);
                    const rowSeats = Math.floor(Math.PI * (b + i)) - Math.floor(seatsToRemove / nRows) - (seatsToRemove % nRows > i ? 1 : 0);
                    const anglePerSeat = Math.PI / rowSeats;
                    for (let j = 0; j < rowSeats; j++) {
                        const s: any = {};
                        s.polar = {
                            r: rowRadius,
                            teta: -Math.PI + anglePerSeat * (j + 0.5)
                        };
                        s.cartesian = {
                            x: s.polar.r * Math.cos(s.polar.teta),
                            y: s.polar.r * Math.sin(s.polar.teta)
                        };
                        seats.push(s);
                    }
                }
            })();

            /* sort the seats by angle */
            seats.sort(function(a, b) {
                return a.polar.teta - b.polar.teta || b.polar.r - a.polar.r;
            });

            /* fill the seat objects with data of its party and of itself if existing */
            (function() {
                let partyIndex = 0;
                let seatIndex = 0;
                seats.forEach(function(s) {
                    let party = d[partyIndex];
                    let nSeatsInParty = typeof party.seats === 'number' ? party.seats : party.seats.length;
                    if (seatIndex >= nSeatsInParty) {
                        partyIndex++;
                        seatIndex = 0;
                        party = d[partyIndex];
                    }
                    s.party = party;
                    s.data = typeof party.seats === 'number' ? null : party.seats[seatIndex];
                    seatIndex++;
                });
            })();

            /***
             * helpers to get value from seat data */
            const seatClasses = function(d: any) {
                let c = "seat ";
                c += (d.party && d.party.id) || "";
                return c.trim();
            };
            const seatX = function(d: any) { return d.cartesian.x; };
            const seatY = function(d: any) { return d.cartesian.y; };
            const seatRadius = function(d: any) {
                let r = 0.4 * rowWidth;
                if (d.data && typeof d.data.size === 'number') {
                    r *= d.data.size;
                }
                return r;
            };

            /***
             * fill svg with seats as circles */
            let container = svg.select(".parliament");
            if (container.empty()) {
                container = svg.append("g");
                container.classed("parliament", true);
            }
            container.attr("transform", "translate(" + width / 2 + "," + outerParliamentRadius + ")");

            const circles = container.selectAll(".seat").data(seats);
            circles.attr("class", seatClasses);

            const circlesEnter = circles.enter().append("circle");
            circlesEnter.attr("class", seatClasses);
            circlesEnter.attr("cx", enter.fromCenter ? 0 : seatX);
            circlesEnter.attr("cy", enter.fromCenter ? 0 : seatY);
            circlesEnter.attr("r", enter.smallToBig ? 0 : seatRadius);
            
            if (enter.fromCenter || enter.smallToBig) {
                const t = circlesEnter.transition().duration(function() { return 1000 + Math.random() * 800; });
                if (enter.fromCenter) {
                    t.attr("cx", seatX);
                    t.attr("cy", seatY);
                }
                if (enter.smallToBig) {
                    t.attr("r", seatRadius);
                }
            }

            // D3 v7 events fix
            const eventNames = ["click", "dblclick", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "touchcancel", "touchend", "touchmove", "touchstart"];
            eventNames.forEach(evt => {
                circlesEnter.on(evt, function(event, d) { 
                    parliamentDispatch.call(evt as any, this, event, d); 
                });
            });

            // D3 v7 merge fix
            const circlesMerged = circlesEnter.merge(circles as any);

            if (update.animate) {
                circlesMerged.transition().duration(function() { return 1000 + Math.random() * 800; })
                    .attr("cx", seatX)
                    .attr("cy", seatY)
                    .attr("r", seatRadius);
            } else {
                circlesMerged.attr("cx", seatX)
                    .attr("cy", seatY)
                    .attr("r", seatRadius);
            }

            if (exit.toCenter || exit.bigToSmall) {
                const t = circles.exit().transition().duration(function() { return 1000 + Math.random() * 800; });
                if (exit.toCenter) {
                    t.attr("cx", 0).attr("cy", 0);
                }
                if (exit.bigToSmall) {
                    t.attr("r", 0);
                }
                t.remove();
            } else {
                circles.exit().remove();
            }
        });
    }

    parliamentFn.width = function(value?: number): any {
        if (!arguments.length) return width;
        width = value!;
        return parliamentFn;
    };

    parliamentFn.height = function(value?: number): any {
        if (!arguments.length) return height;
        return parliamentFn;
    };

    parliamentFn.innerRadiusCoef = function(value?: number): any {
        if (!arguments.length) return innerRadiusCoef;
        innerRadiusCoef = value!;
        return parliamentFn;
    };

    parliamentFn.enter = {
        smallToBig: function(value?: boolean): any {
            if (!arguments.length) return enter.smallToBig;
            enter.smallToBig = value!;
            return parliamentFn.enter;
        },
        fromCenter: function(value?: boolean): any {
            if (!arguments.length) return enter.fromCenter;
            enter.fromCenter = value!;
            return parliamentFn.enter;
        }
    };

    parliamentFn.update = {
        animate: function(value?: boolean): any {
            if (!arguments.length) return update.animate;
            update.animate = value!;
            return parliamentFn.update;
        }
    };

    parliamentFn.exit = {
        bigToSmall: function(value?: boolean): any {
            if (!arguments.length) return exit.bigToSmall;
            exit.bigToSmall = value!;
            return parliamentFn.exit;
        },
        toCenter: function(value?: boolean): any {
            if (!arguments.length) return exit.toCenter;
            exit.toCenter = value!;
            return parliamentFn.exit;
        }
    };

    parliamentFn.on = function(type: string, callback: any) {
        parliamentDispatch.on(type as any, callback);
    };

    return parliamentFn;

    function series(s: (i: number) => number, n: number) { 
        let r = 0; 
        for (let i = 0; i <= n; i++) { 
            r += s(i); 
        } 
        return r; 
    }
}
