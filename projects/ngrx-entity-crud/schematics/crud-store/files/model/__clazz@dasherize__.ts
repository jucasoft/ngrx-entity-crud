export class <%= clazz %> {
    public id: string = undefined;
    /**
     * metodo statico utilizzato per recuperare l'id dell'entita.
     * @param item
     */
    static selectId: (item: <%= clazz %>) => string = item => item.id;
}
