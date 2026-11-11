/**
 * Runs `step` on each item, the next one only after the last has finished, so requests stay paced.
 */
export const inOrder = async <Item extends object | string | number>(
	items: readonly Item[],
	step: (item: Item, index: number) => Promise<unknown>,
	from = 0,
): Promise<void> => {
	const item = items[from];
	if (item !== undefined) {
		await step(item, from);
		await inOrder(items, step, from + 1);
	}
};
