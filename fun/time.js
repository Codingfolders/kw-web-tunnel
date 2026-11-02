function changeTimeUnit (input) {
    if (typeof(input) === 'number') return input;
    if (typeof(input) !== 'string') throw Error(`Invliad value entered: ${input}`);
    
    const match = input.match(/^(\d+)([smh])$/);
    
    if (!match) throw Error(`Invliad value entered: ${input}`);
    
    const unit = match[2];
    const value = parseInt(input.slice(0, -1));

    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        default: throw Error(`Invliad value entered: ${input}`);
    }
}

module.exports = { changeTimeUnit };