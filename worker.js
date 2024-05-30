onmessage = function (e) {
    try {
        let smallestVolumeTetrahedron;

        // Parsing all the points data from the txt to a 2d array.
        const pointsList = e.data
            .toString()
            .split('\n')
            .map(point =>
                point
                    .replace(/[\(\)\\\r]/g, '')
                    .split(', ')
                    .map(number => parseFloat(number))
            )

        postMessage({ type: 'progress', data: 'Getting list of all the unique values, bind to each of the points' });
        // Getting list of all the unique values, bind to each of the points.
        const uniquePointsValues = pointsList.reduce((acc, point) => {
            acc.includes(point[3]) ? null : acc.push(point[3]);
            return acc
        }, []).sort();


        // Implication applied, that the values are from 0 to 100 - with even step between.
        // Like in the test files  - 0, 10, 20 ...100 or 0, 1, 2 ... 100.
        // This is the value ofa difference between adjascent n values.
        const step = uniquePointsValues[1] - uniquePointsValues[0];

        // Finding all the combinations of the points values, that satisfy the condition of summ === 100.
        function findCombinations() {
            const length = 100;
            const combinations = [];
            let count = 1;
            // Generate all valid values combinations (for which summ === 100). No recursion, for simpler readability and more clear logics.
            for (let i = length; i >= 0; i -= step) {
                for (let j = length - i; j >= 0; j -= step) {
                    for (let k = length - i - j; k >= 0; k -= step) {
                        for (let l = length - i - j - k; l >= 0; l -= step) {

                            const summ = i + j + k + l;
                            if (summ !== 100) continue;

                            // Since the position of the element in the array of points is irrelevant, sorting combination 
                            // for simpler filtering in the next interations.
                            const currentCombination = [i, j, k, l].sort();

                            // Since the position of the element in the array of points is irrelevant, we need to weed out combinations
                            // with the same values on different positions, e.g. [10, 0, 20, 70] and [0, 20, 70, 10].
                            const isRepeat = combinations.some(combination => {
                                return (
                                    combination[1] === currentCombination[1] &&
                                    combination[2] === currentCombination[2] &&
                                    combination[3] === currentCombination[3] &&
                                    combination[4] === currentCombination[4])
                            });
                            if (isRepeat) continue;

                            combinations.push(currentCombination);
                            console.clear();
                            console.log('findCombinations combinations : ', combinations.length + ' count : ' + count);

                            count += 1;
                        }
                    }
                }
            }

            return combinations;
        }

        const validPointsCombinations = findCombinations();
        postMessage({ type: 'progress', data: 'The valid points values combinations are : \n' + validPointsCombinations.join('\n') });


        // Obtaining list of all the tetrahedrons (4 points combinations) for each of the valid points values combination.
        function findTetrahedronsList() {

            // Grouping all points by their values as a key-value pair in object, 
            // adding the original element index to the end of each point data.
            const pointsGroupsByValue = pointsList.reduce((acc, point, index) => {
                (point[3] in acc) ? null : acc[point[3]] = [];
                acc[point[3]].push([...point, index]);
                return acc;
            }, {});
            const tetrahedronsList = [];

            validPointsCombinations.forEach(valuesCombination => {
                // Getting a list of tetrahedrons for each valid values combination.
                // Unique value is being addressed as a key with [] notation.
                const [first, second, third, fourth] = valuesCombination;
                for (let i = 0; i < pointsGroupsByValue[first].length; i++) {
                    for (let j = 0; j < pointsGroupsByValue[second].length; j++) {
                        for (let k = 0; k < pointsGroupsByValue[third].length; k++) {
                            for (let l = 0; l < pointsGroupsByValue[fourth].length; l++) {
                                // Current combination of the original indexes of points.
                                // The position of the element in the array of points is irrelevant, since the index is a part of the point array now.
                                const currentCombination = [
                                    pointsGroupsByValue[first][i].at(-1),
                                    pointsGroupsByValue[second][j].at(-1),
                                    pointsGroupsByValue[third][k].at(-1),
                                    pointsGroupsByValue[fourth][l].at(-1),
                                ].sort();
                                // Checking for duplicate indexes, to avoid using the same point twice.
                                if (new Set(currentCombination).size !== 4) continue;

                                // Weed out combinations with the same values on different positions.
                                const isRepeat = tetrahedronsList.some(combination => {
                                    return (
                                        combination[1] === currentCombination[1] &&
                                        combination[2] === currentCombination[2] &&
                                        combination[3] === currentCombination[3] &&
                                        combination[4] === currentCombination[4])
                                });

                                if (isRepeat) continue;

                                tetrahedronsList.push(currentCombination);

                            }
                        }
                    }
                }
            })
            return tetrahedronsList;
        }

        postMessage({ type: 'progress', data: 'Calculating all the potential tetrahedrons' });
        // List of all the potential tetrahedrons (by points indexes in the original list), that satisfy the sum === 100 condition.
        const tetrahedronsPointsIndexesList = findTetrahedronsList();

        postMessage({ type: 'progress', data: 'There are ' + tetrahedronsPointsIndexesList.length + ' tethraedrons, that satisfy summ === 100 condition' });


        // Now have to find the one with the smallest volume.
        // Thanks for the courtesy of providing the volume calculation code!

        function volumeOfTetrahedron(p1, p2, p3, p4) {
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

        // Calculating the volume of all the found tetrahedrons.
        // Forming an array with elements of the following structure :
        // [
        //   volume,
        //   [...indexes of the tetrahedron vertices ]
        // ]

        postMessage({ type: 'progress', data: ' Calculating the volume of all the found tetrahedrons' });
        tetrahedronsPointsIndexesList.forEach((singleFigure) => {
            // For each set of points (each tetrahedron), getting the points actual coordinates by their indexes in the
            // original dataset and calcualting the volume.
            const vol = volumeOfTetrahedron(
                pointsList[singleFigure[0]],
                pointsList[singleFigure[1]],
                pointsList[singleFigure[2]],
                pointsList[singleFigure[3]]
            );
            if (smallestVolumeTetrahedron) {
                vol <= smallestVolumeTetrahedron[0] ? smallestVolumeTetrahedron = [vol, singleFigure] : null;
            } else {
                // First iteration initialization.
                smallestVolumeTetrahedron = [vol, singleFigure];
            }
        });

        smallestVolumeTetrahedron[1].sort(((a, b) => a - b));

        postMessage({ type: 'progress', data: 'The smallest volume is : ' + smallestVolumeTetrahedron[0] });
        postMessage({ type: 'result', data: smallestVolumeTetrahedron[1].join() });
    }
    catch (e) {
        postMessage({ type: 'error', data: e.message });
    }
    finally {
        console.timeEnd('time')
    }
}
