export function updateWithMap<T extends object>(objectToUpdate: T, updateMap: Partial<T>, passedTopLevelObject: Object|undefined = undefined): T {
    const topLevelObject = passedTopLevelObject || objectToUpdate;
    const mappingObjectProps = Object.keys(updateMap);

    let updatedObject = { ...objectToUpdate };

    if (!mappingObjectProps.length) {
        return { ...updatedObject, ...updateMap };
    }

    mappingObjectProps.forEach(property => {
        const valueToMap = updateMap[property];
        const existingValue = objectToUpdate[property];

        if (typeof valueToMap === 'undefined') {
            console.warn(`Property value ${property} is ${valueToMap}. You should nullify properties in data objects or set them to be empty.`);
        }

        if (valueToMap
            && existingValue
            && typeof valueToMap === 'object'
            && !Array.isArray(valueToMap)) {
            updatedObject = { ...updatedObject,
                [property]: updateWithMap(existingValue, valueToMap, topLevelObject)
            };
        } else if (typeof valueToMap === 'function') {
            updatedObject = { ...updatedObject,
                [property]: valueToMap(existingValue, topLevelObject)
            };
        } else {
            updatedObject = { ...updatedObject,
                [property]: valueToMap
            };
        }
    });

    return updatedObject;
}