const SERVER_NAME = 'patient-management-system-api';
const PORT = 4000;
const HOST = '127.0.0.1';

const mongoose = require('mongoose');
const uristring =
  'mongodb+srv://admin:EKxrUzfnb5K4hJMA@cluster0.evqs7we.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(uristring, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database connection has been established ' + uristring);
});

const errors = require('restify-errors');

const PatientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  genotype: String,
  blood_group: String,
  email: String,
  phone_number: String,
  house_address: String,
  department: String,
  doctor: String,
});

const PatientModel = mongoose.model('Patients', PatientSchema);

const restify = require('restify');
const server = restify.createServer({ name: SERVER_NAME });

server.listen(PORT, HOST, function () {
  console.log('Server %s listening at %s', server.name, server.url);
  console.log('**** Resources: ****');
  console.log('********************');
  console.log('Endpoints:');
  console.log('----------------------------');
  console.log(`GET PATIENTS (method: GET) => ${HOST}:${PORT}/patients`);
  console.log(`GET SINGLE PATIENT (method: GET) => ${HOST}:${PORT}/patients/:id`);
  console.log(`DELETE A PATIENT (method: DELETE) => ${HOST}:${PORT}/patients/:id`);
  console.log(`ADD NEW PATIENT (method: POST) => ${HOST}:${PORT}/patients`);
});

server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

// Define a route for getting a list of patients
server.get('/patients', (req, res, next) => {
  PatientModel.find({})
    .exec()
    .then((patients) => {
      res.send(patients);
      return next();
    })
    .catch((err) => {
      res.send(500, new errors.InternalServerError(err));
      return next();
    });
});

// Define a route for getting a single patient by ID
server.get('/patients/:id', (req, res, next) => {
  PatientModel.findById(req.params.id)
    .select('-__v') // Exclude the __v field
    .exec()
    .then((patient) => {
      if (!patient) {
        res.send(404, new errors.NotFoundError('Patient not found'));
      } else {
        res.send(patient);
      }
      return next();
    })
    .catch((err) => {
      res.send(500, new errors.InternalServerError(err));
      return next();
    });
});

// Define a route for deleting a patient by ID
server.del('/patients/:id', (req, res, next) => {
  PatientModel.findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
      res.send(204); // No Content
      return next();
    })
    .catch((err) => {
      res.send(500, new errors.InternalServerError(err));
      return next();
    });
});

// Define a route for adding a new patient
server.post('/patients', (req, res, next) => {
  // Create a new PatientModel instance with the provided fields
  const newPatient = new PatientModel({
    name: req.body.first_name + ' ' + req.body.last_name,
    age: calculateAge(req.body.date_of_birth),
    gender: req.body.gender,
    genotype: req.body.genotype,
    blood_group: req.body.blood_group,
    email: req.body.email,
    phone_number: req.body.phone_number,
    house_address: req.body.house_address,
    department: req.body.department,
    doctor: req.body.doctor,
  });

  newPatient
    .save()
    .then((savedPatient) => {
      res.send(201, savedPatient); // Created
      return next();
    })
    .catch((err) => {
      res.send(500, new errors.InternalServerError(err));
      return next();
    });
});

// Function to calculate age based on the provided date of birth
function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const ageDiffMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDiffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Handle unhandled requests
server.on('restifyError', (req, res, err, callback) => {
  return callback();
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Server ${SERVER_NAME} is running at ${HOST}:${PORT}`);
});
