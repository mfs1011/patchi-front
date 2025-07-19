export default async function(router, newParams) {
    await router.replace({
        query: {
            ...newParams,
        },
    });
}
