import { Box, FormControl, FormLabel, TextField, Button} from '@mui/material';
import { THEME_COLOR, ACCENT_COLOR } from '../constants/colors';
import { useState, useEffect } from 'react';
import {scheduleParser} from '../utils/validateSchedule';
import { useNavigate, useParams } from 'react-router-dom';
import PopoverButton from './PopoverButton';
import { useAuth } from '../context/AuthProvider';
import { getJob } from '../services/jobs';
import { scheduleString } from '../utils/scheduleString';

const EditForm = ({ onSubmitEditForm, addErrorMessage }) => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [name, setJobName] = useState(null);
  const [command, setCommand] = useState(null);
  const [tolerableRuntime, setTolerableRuntime] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try { 
        const currentJob = await getJob(id, token);
        console.log('fetching job:', currentJob)

        setJob(currentJob);
        setLoaded(true);
        setSchedule(currentJob.schedule);
        setJobName(currentJob.name);
        setCommand(currentJob.command);
        setTolerableRuntime(currentJob.tolerable_runtime);
      } catch (error) {
        console.log(error);
      }
    }

    fetchJob();
  }, []);

  const handleValidateForm = () => {
    if (!schedule) {
      addErrorMessage("Must have a schedule.");
      return false;
    }
    const parsedSchedule = scheduleParser(schedule);

    if (!parsedSchedule.valid) {
      addErrorMessage(parsedSchedule.error);
      return false;
    }
    return true;
  }

  const handleSubmitForm = () => {
    const jobData = {
      schedule: schedule,
      name: name || undefined,
      command: command || undefined,
      tolerableRuntime: tolerableRuntime || undefined,
      type: 'dual'
    };

    navigate(-1);
    return onSubmitEditForm(job.id, jobData);
  }

  const boxStyle = {
    width: '100%',
    padding: '20px',
    margin: '10px',
  };

  const divStyle = {
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    borderRadius: '8px',
    backgroundColor: THEME_COLOR,
    maxWidth: '90%', 
  }

  return (
    <div style={{marginTop: '20px', marginLeft: '5%'}}>
      <Button onClick={() => navigate(-1)} sx={{marginBottom: '20px', marginLeft: '10px'}} variant="contained">Back</Button>
      { loaded ? 
      <div style={divStyle}>
        <FormControl  margin="normal" variant="outlined" sx={{margin: '10px'}}>
          <FormLabel sx={{fontSize:'20px'}}>Job: {job.name || 'Nameless'}</FormLabel>
          <Box
            component="form"
            sx={boxStyle}
            noValidate
            autoComplete="off"
            >
            <TextField
              required
              sx={{padding: '5px'}}
              id="outlined-required"
              label="Schedule (required)"
              helperText={scheduleString(schedule)}
              value={schedule}
              onChange={(e) => { setSchedule(e.target.value)}}
              FormHelperTextProps={{ style: { color: ACCENT_COLOR } }}
              inputProps={{ style: { color: ACCENT_COLOR } }}
            />
            <TextField
              sx={{padding: '5px'}}
              id="outlined-basic"
              label="Name"
              value={name}
              onChange={(e) => setJobName(e.target.value)}
              inputProps={{ style: { color: ACCENT_COLOR } }}
            />
            <TextField
              sx={{padding: '5px'}}
              id="outlined-basic"
              label="Command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              inputProps={{ style: { color: ACCENT_COLOR } }}
            />
            <TextField
              sx={{padding: '5px'}}
              id="outlined-basic"
              label='Tolerable Runtime (s)'
              value={tolerableRuntime}
              onChange={(e) => setTolerableRuntime(e.target.value)}
              inputProps={{ style: { color: ACCENT_COLOR } }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                padding: '5px',
              }}
              >
              <PopoverButton variant='contained' onValidate={handleValidateForm} onAction={handleSubmitForm} buttonName={'Submit'} heading={"Are you sure of the changes you've made?"}></PopoverButton>
            </Box>
          </Box>
        </FormControl>
      </div>
      : <p>Loading...</p>}
    </div>
  )
}

export default EditForm;
