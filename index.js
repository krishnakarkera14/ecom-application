const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const usersRepo = require('./repos/users');
const { comparePasswd } = require('./repos/users');

const app = express();

app.use(bodyParser.urlencoded({ extended:true }));
app.use(cookieSession({
    keys: ['78q9dyf3097']
}))

app.get('/signup', (req,res) => {
    res.send(`
    <div>
    <h1>Sign-Up</h1>
    Your Id is: ${req.session.userId}
        <form method="POST">
            <input name="email" placeholder="email"/>
            <input name="password" type="password" placeholder="password"/>
            <input name="passwordConfirmation" type="password"placeholder="password confirmation"/>
            <button>Sign-Up</button>
        </form>
    </div>

    `);
});


app.post('/signup', async (req,res) => {
    const { email , password, passwordConfirmation} = req.body;
    const existingUser = await usersRepo.getOneBy({email: email});

    
    if (existingUser) {
        return res.send('Email in use');
    }

    if (password !== passwordConfirmation) {
        return res.send('password must match');
    }

    //Create User in our user repo to represent this person
    const user = await usersRepo.create({email:email, password:password});
    //Store the id of that user inside the cookie
    req.session.userId = user.id; 

    res.send('Account Created');
});

app.get('/logout', (req, res) =>{
    req.session = null;
    res.send('You are Logged Out');
});

app.get('/login', (req, res) => {
    res.send(`
    <div>
    <h1>Log-In</h1>
    Your Id is: ${req.session.userId}
        <form method="POST">
            <input name="email" placeholder="email"/>
            <input name="password" type="password" placeholder="password"/>
            <button>log-in</button>
        </form>
    </div>
    `)
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await usersRepo.getOneBy({email:email});
    if (!user) {
        return res.send('Email Not Found');
    }

    const validPassword = await comparePasswd(user.password,password)
    
    if (!validPassword) {
        return res.send('Invalid Password');
    }

    req.session.userId = user.id;
    res.send('You are Logged In');
});

app.listen(3000, () => {
    console.log('Listening');
}); 