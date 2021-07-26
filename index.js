const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const {User} = require('./models/User');
const config = require('./config/key')

const port = 3000;
const app = express();

// application/json
app.use(express.json());
app.use(cookieParser());
// application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

// connect to DB
mongoose.connect( config.mongoURI, {
    // error 방지
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('MongoDB connected...'))
.catch( err => console.log(err));

app.get('/', (req, res) => res.send('Hello World! hihi'));

app.post('/register', (req, res) => {
    // register user info to DB
    const user = new User(req.body);

    user.save((err, doc) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({success: true})
    });
});

app.post('/login', (req, res) => {
    // 1. check if there is the same email address in DB
    // 2. if there is, check password
    // 3. if it correct, create token
    
    // 1.
    User.findOne({email: req.body.email}, (err, userInfo) => {
        if(!userInfo){
            return res.json({
                loginSuccess: false,
                message: "일치하는 e-mail이 없습니다."
            });
        }
        userInfo.comparePassword(req.body.password, (err, isMatch) => { // 2.
            if(!isMatch) return res.json({
                loginSuccess: false, 
                message: "잘못된 비밀번호입니다."
            });
            userInfo.generateToken((err, user) => { // 3.
                if(err) return res.status(400).send(err);
                // 쿠키에 토큰 저장
                res.cookie("x_auth", user.token).status(200).json({
                    loginSuccess: true,
                    userId: user._id
                })
            })
        })
        
    })
})

app.listen(port, () => console.log(`Listening on port ${port}...`))