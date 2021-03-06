import Ember from 'ember';
import Job from '../models/job';
import ENV from '../config/environment';

export default Ember.Controller.extend({
    needs: ["jobs/index"],

    jobId: '',

    initStatsRefresh: function() {
        var self = this;
        self.updateStats(); // first call

        if (!isNaN(ENV.updateInterval)) {
            setInterval(() => self.updateStats(), ENV.updateInterval); // every Xs
        }
    }.on('init'),

    updateStats: function() {
        var self = this;
        Job.stats().then(function(data) {
            self.set('stats', data);
            return self.getCountBreakdowns();
        })
        .then(function(res) {
            self.set('breakdowns', res);
            self.get('controllers.jobs/index').set('breakdowns', res);
        });
    },

    getAllStates: function(type) {
        var promises = Job.STATES.map(function(state) {
            var query = { type: type, state: state };
            return Job.stats(query).then( res => _.extend(res, query) );
        });
        return Ember.RSVP.Promise.all(promises);
    },

    getCountBreakdowns: function() {
        var self = this;
        return Job.stats().then(function(stats) {
            return self.controllerFor('jobs.index').set('stats', stats);
        })
        .then(function() {
            return Job.types();
        })
        .then(function(types) {
            var promises = types.map(type =>  self.getAllStates(type));
            return Ember.RSVP.Promise.all(promises).then(_.flatten);
        });
    },

    actions: {
        goToTypeRoute: function(obj) {
            this.transitionToRoute('jobs.type', obj.type, {queryParams:
                {state: obj.state || 'active'}
            });
        },

        goToJobRoute: function() {
            this.transitionToRoute('jobs.show', this.get('jobId'));
        }
    }

});
