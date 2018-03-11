const DbObject = require('../lib/db').DbObject

class RentalItem extends DbObject {
    
    static scopeDefs() {
        return {}
    }
    
    static columnDefs(DataTypes) {
        return {
            title: DataTypes.STRING,
            description: DataTypes.TEXT,
            created_by: DataTypes.INTEGER,
            thumbnail_url: DataTypes.STRING,
            currencyCode: DataTypes.STRING,
            price: DataTypes.DOUBLE,
            available_date: DataTypes.DATE,
            delivery_option: DataTypes.STRING
        }
    }
    
    static associate(models) {
    
    }
}

module.exports = RentalItem
