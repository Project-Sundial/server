import React from 'react';
import { useState, useEffect } from 'react';
import { List, Box, Typography, Button, Divider, Grid, Pagination } from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Run from './Run'
import PopoverButton from './PopoverButton';
import { useAuth } from '../context/AuthProvider';
import { PAGE_LIMIT } from '../constants/pagination';
import calculateOffset from '../utils/calculateOffset';
import { getSse } from '../services/sse';
import { getJob, getRuns } from '../services/jobs';
import { THEME_COLOR, ACCENT_COLOR, BACKGROUND_COLOR } from '../constants/colors';


const RunsList = ({ onDelete, onError }) => {
  const { id } = useParams();
  const [runs, setRuns] = useState([]);
  const [job, setJob] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const currentJob = await getJob(id, token);
        setJob(currentJob);
        setLoaded(true);
      } catch (error) {
        onError(error);
      }
    };
  
    fetchJob();
  }, [id, token]);  

  useEffect(() => {
    if (job) {
      const newSse = getSse();

      newSse.onerror = (error) => {
        console.log('An error occured establishing an SSE connection.');
        newSse.close();
      };

      newSse.addEventListener('newRun', (event) => {
        if (page !== 1) return;

        const newRun = JSON.parse(event.data);
        console.log('New run:', newRun);

        setRuns(runs => {
          if (job && job.id === newRun.monitor_id && !runs.find(run => run.id === newRun.id)) {

            const newRunData = [newRun].concat(runs);
            if (newRunData.length > PAGE_LIMIT) {
              newRunData.length = PAGE_LIMIT;
            }
            return newRunData;
          } else {
            return runs;
          }
        });
      });

      newSse.addEventListener('updatedRun', (event) => {
        const updatedRun = JSON.parse(event.data);
        console.log('Updated run:', updatedRun);

        setRuns(runs => {
          if (job && job.id === updatedRun.monitor_id) {
            return runs.map(run => {
                if (run.id === updatedRun.id) {
                  return updatedRun;
                } else {
                  return run;
                }
              });
          } else {
            return runs;
          }
        });
      });

      return () => {
        console.log("Cleaning up SSE connection");
        newSse.close();
      };
    }
   }, [job, page]);

  useEffect(() => {
    const fetchRuns = async () => {
      try { 
        const data = await getRuns(job.id, PAGE_LIMIT, calculateOffset(page, PAGE_LIMIT), token);
        setRuns(data.runs);
        setTotalPages(data.totalPages);
      } catch (error) {
        onError(error);
      }
    }

    if (job) {
      fetchRuns();
    }
  }, [page, job, token]);
  
  const handleDelete= () => {
    navigate("/jobs");
    onDelete(job.id);
  }

  const onPageChange = (_, newPage) => {
    setPage(newPage);
  }

  const boxStyle = {
    width: '100%',
    padding: '20px',
    margin: '10px',
  };

  const divStyle = {
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    backgroundColor: THEME_COLOR,
    borderRadius: '8px',
    maxWidth: '90%', 
  }

  return (
    <div style={{ marginTop: '20px', marginLeft: '5%'}}>
      <Button onClick={() => navigate('/jobs')} sx={{marginBottom: '20px', marginLeft: '10px' }} variant="contained">Back</Button>
      { loaded ? 
        <div style={divStyle}>
        <Box sx={boxStyle}>
          <Grid container spacing={3}>
            <Grid item xs={9} >
              <Typography variant="h4">Runs Log of Job: {job.name || 'Nameless'}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Link to={`/jobs/edit/${job.id}`}>
                <Button sx={{ fontSize: '14px', margin: '0px' }} variant="contained">EDIT</Button>
              </Link>
            </Grid>
             <Grid item xs={2}>
              <PopoverButton onAction={handleDelete} buttonName={"DELETE"} heading={"Are you sure you want to delete this job?"}/>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">Schedule:</Typography>
            </Grid>
            <Grid item xs={7}>
              {job.command && (
              <Typography variant="body2">Command:</Typography>
              )}
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2">Status:</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body1">{job.schedule}</Typography>
            </Grid>
            <Grid item xs={7}>
              {job.command && (
              <Typography variant="body1">{job.command}</Typography>
              )}
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body1">{job.failing ? 'Failing' : 'All Sunny!'}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{padding: "10px"}}/>
          <List>
            {runs.map((run) => (
            <Run run={run} key={run.id}/>
            ))}
          </List>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Pagination 
              sx={{ 
                '& .MuiPaginationItem-root': { color: ACCENT_COLOR },
                '& .MuiPaginationItem-page, & .MuiPaginationItem-previous, & .MuiPaginationItem-next': {
                  color: ACCENT_COLOR,
                },
              }}
              count={totalPages} 
              size="large" 
              page={page} 
              onChange={onPageChange} 
            />
          </Box>
        </Box>
      </div>
    : <p>Loading...</p>}
    </div>
  );
};

export default RunsList;
