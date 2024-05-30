function calculateSmallestTetrahedron(event) {
    const start = performance.now();
    try {
        // Parsing all the points data from the txt to a 2d array.
        const data = event.data
            .toString()
            .split('\n')
            .map(point =>
                point
                    .replace(/[\(\)\\\r]/g, '')
                    .split(', ')
                    .map(number => parseFloat(number))
            )


        /**                
         *                 #############################
         *                 ### Utility methods block ### 
         *                 #############################
         **/

        /**  Getting all the unique n values. */
        const getUniqueNValues = () => {
            const values = data.reduce((acc, point) => {
                acc.includes(point[3]) ? null : acc.push(point[3]);
                return acc
            }, []);
            values.sort((a, b) => a - b);
            return values;
        }

        /** Finding all the combinations of the points values, that satisfy the condition of summ === 100. */
        const findNCombinations = () => {
            const maxValue = uniquePointsValues[uniquePointsValues.length - 1];

            // Implication applied, that the n values are from 0 to 100 - with even step between.
            // Like in the test files - 0, 10, 20 ...100 or 0, 1, 2 ... 100.
            // Getting is the value of a difference between adjascent n values.
            const step = uniquePointsValues[1] - uniquePointsValues[0];
            const combinations = [];
            // Generate all valid values combinations (for which summ === 100). No recursion, for simpler readability and debugging.
            for (let i = maxValue; i >= 0; i -= step) {
                for (let j = maxValue - i; j >= 0; j -= step) {
                    for (let k = maxValue - i - j; k >= 0; k -= step) {
                        for (let l = maxValue - i - j - k; l >= 0; l -= step) {

                            const summ = i + j + k + l;
                            if (summ !== 100) continue;

                            // Since the position of the element in the array of points is irrelevant, sorting combination 
                            // for simpler filtering in the next interations.
                            const currentCombination = [i, j, k, l].sort();

                            // Since the position of the element in the array of points is irrelevant, we need to weed out combinations
                            // with the same values on different positions, e.g. [10, 0, 20, 70] and [0, 20, 70, 10].
                            const isRepeat = combinations.some(combination =>
                                combination[1] === currentCombination[1] &&
                                combination[2] === currentCombination[2] &&
                                combination[3] === currentCombination[3] &&
                                combination[4] === currentCombination[4]
                            );
                            if (isRepeat) continue;

                            combinations.push(currentCombination);
                        }
                    }
                }
            }

            return combinations;
        }

        /**  Calculating the volume of each tetrahedron that satisfiessumm === 100 condition
         *   and compare it to the previous smallest volume. */
        const findTetrahedron = () => {
            let smallestVolumeTetrahedron;

            // Grouping all points by their values as a key-value pair in object, 
            // adding the original element index to the end of each point data.

            const pointsGroupsByValue = data.reduce((acc, point, index) => {
                (point[3] in acc) ? null : acc[point[3]] = [];
                acc[point[3]].push([...point, index]);
                return acc;
            }, {});
            let count = 0;

            validPointsCombinations.forEach(valuesCombination => {
                // Iterating through all tetrahedrons for each valid values combination,
                // excluding same point repeats in each of 4 points set.
                // Unique value is being addressed as a key with [] notation.
                const [first, second, third, fourth] = valuesCombination;
                const currentCombination = [];
                for (let i = 0; i < pointsGroupsByValue[first].length; i++) {
                    if (currentCombination.includes(pointsGroupsByValue[first][i].at(-1))) continue;
                    currentCombination[0] = pointsGroupsByValue[first][i].at(-1);

                    for (let j = 0; j < pointsGroupsByValue[second].length; j++) {
                        if (currentCombination.includes(pointsGroupsByValue[second][j].at(-1))) continue;
                        currentCombination[1] = pointsGroupsByValue[second][j].at(-1)

                        for (let k = 0; k < pointsGroupsByValue[third].length; k++) {
                            if (currentCombination.includes(pointsGroupsByValue[third][k].at(-1))) continue;
                            currentCombination[2] = pointsGroupsByValue[third][k].at(-1)

                            for (let l = 0; l < pointsGroupsByValue[fourth].length; l++) {
                                if (currentCombination.includes(pointsGroupsByValue[fourth][l].at(-1))) continue;
                                count += 1;
                                currentCombination[3] = pointsGroupsByValue[fourth][l].at(-1)

                                const vol = volumeOfTetrahedron(
                                    data[currentCombination[0]],
                                    data[currentCombination[1]],
                                    data[currentCombination[2]],
                                    data[currentCombination[3]]
                                );
                                if (smallestVolumeTetrahedron) {
                                    if (vol <= smallestVolumeTetrahedron[0]) {
                                        smallestVolumeTetrahedron = [vol, [...currentCombination]];
                                        console.log('Count : ', count, ' smallest : ', smallestVolumeTetrahedron);
                                        postMessage({ type: 'progress', data: `Iteration : ${count}, current smallest volume : ${smallestVolumeTetrahedron[0]}` });
                                    }
                                } else {
                                    // First iteration initialization.
                                    smallestVolumeTetrahedron = [vol, currentCombination];
                                }
                            }
                        }
                    }
                }
            })
            smallestVolumeTetrahedron[1].sort(((a, b) => a - b))
            return smallestVolumeTetrahedron;
        }

        // Thanks for the courtesy of providing the volume calculation code!
        const volumeOfTetrahedron = (p1, p2, p3, p4) => {
            // Vectors from p1 to p2, p3, and p4
            let AB = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
            let AC = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
            let AD = [p4[0] - p1[0], p4[1] - p1[1], p4[2] - p1[2]];

            // Direct calculation of the cross product components
            let crossProductX = AB[1] * AC[2] - AB[2] * AC[1];
            let crossProductY = AB[2] * AC[0] - AB[0] * AC[2];
            let crossProductZ = AB[0] * AC[1] - AB[1] * AC[0];

            // Dot product of AD with the cross product of AB and AC
            let scalarTripleProduct = (
                AD[0] * crossProductX +
                AD[1] * crossProductY +
                AD[2] * crossProductZ
            );

            // The volume of the tetrahedron
            let volume = Math.abs(scalarTripleProduct) / 6.0;
            return volume;
        }


        /**                
         *                 ############################
         *                 ### Main execution block ### 
         *                 ############################
         **/

        const uniquePointsValues = getUniqueNValues();
        postMessage({ type: 'progress', data: 'Getting list of all the valid n values combinations' });
        const validPointsCombinations = findNCombinations();

        postMessage({ type: 'progress', data: 'Calculating smallest volume tetrahedron' });

        const smallestVolumeTetrahedron = findTetrahedron();

        postMessage({ type: 'progress', data: 'The smallest volume is : ' + smallestVolumeTetrahedron[0] });
        postMessage({ type: 'result', data: smallestVolumeTetrahedron[1] });

        console.timeEnd('time')

        return smallestVolumeTetrahedron;
    }
    catch (e) {
        postMessage({ type: 'error', data: `Error : ` + e.message });
    }
    finally {
        const end = performance.now();
        const timeElapsed = (end - start) / 1000
        postMessage({ type: 'progress', data: 'Time elapsed : ' + String(timeElapsed.toFixed(3)) + ' seconds' });
    }
}

onmessage = calculateSmallestTetrahedron;