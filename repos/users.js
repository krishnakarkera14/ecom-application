const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt)

class UserRepository {
    constructor(filename) {
        if (!filename) {
            throw new Error('Creating a repository requires a filename');
        }

        this.filename = filename;
        try {
            fs.accessSync(this.filename);
        } catch(err) {
            fs.writeFileSync(this.filename, '[]');
        };
    }

    async getAll() {
        return JSON.parse(await fs.promises.readFile(this.filename, {encoding:'utf-8'}));
    }

    async getOne(id) {
        const records = await this.getAll();
        return records.find(record => record.id === id);jav
    }

    async getOneBy(filters) {
        const records = await this.getAll();

        for (let record of records) {
            let found = true;

            for (let key in filters) {
                if (record[key] !== filters[key]) {
                    found = false;
                }
            }

            if (found) {
                return record;
            }
        }
    }

    async create(attributes) {
        attributes.id = this.randomId();
        
        const salt = crypto.randomBytes(8).toString('hex');
        const buf = await scrypt(attributes.password, salt, 64);

        const records = await this.getAll();  //retrieve the latest version of 'records'
        const record = {...attributes, password :`${buf.toString('hex')}.${salt}`};
        records.push(record);   //push the new attributes to the array
        await this.writeAll(records);

        return record;
    }

    async update(id, attributes) {
        const records = await this.getAll();
        const record = records.find(record => record.id === id);
        
        if (!record) {
            throw new Error(`Record with ${id} not found.`);
        }
        
        Object.assign(record, attributes);
        await this.writeAll(records);
    }

    async delete(id) {
        const records = await this.getAll();
        const filteredRecords = records.filter(record => record.id !== id);
        await this.writeAll(filteredRecords);
    }

    async comparePasswd(saved, supplied) {
        //saved -> password saved in our database
        //supplied -> password supplied by the user trying to log in

        const [hashed, salt] = saved.split('.');
        const hashedSuppliedBuf = await scrypt(supplied,salt,64);

        return hashed === hashedSuppliedBuf.toString('hex');
    }

    async writeAll(records) {
        await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2));
    }

    randomId() {
        return crypto.randomBytes(4).toString('hex');
    }
};

module.exports = new UserRepository('users.json');