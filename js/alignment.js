//_ = require('underscore');



if (typeof alignment_demo === 'undefined') {
    alignment_demo = function() {};
}


alignment_demo.generate_table = function (id,
                                          styles,
                                          seq1,
                                          seq2,
                                          match,
                                          mismatch,
                                          insertion,
                                          deletion
                                          ) {

    function score_move (i,j,move1,move2,t) {
        if (move1) {
            if (move2) {
                if (seq1[i] == seq2[j]) {
                    return match;
                }
                return -mismatch;
            } else {
                return -deletion;
            }
        }
        return -insertion;
    }


    function handle_hover (d,  seq1_idx, seq2_idx) {

        seq1_idx --;

        var popover_obj = $(d3.select(this)[0]),
            content     = [];

        if (seq1_idx > 0 && seq2_idx > 0) {
            var move_score = score_move (seq1_idx-1, seq2_idx-1,1,1);

            content.push (["<i class='fa fa-arrow-right fa-rotate-45'></i>Align " +
                seq1[seq1_idx-1] + " and " +
                seq2[seq2_idx-1] + " (score " +
                move_score + ")", move_score + scores[seq2_idx-1][seq1_idx-1]]);
        }
        if (seq1_idx > 0) {
           var move_score = score_move (seq1_idx-1, seq2_idx-1,1,0);

             content.push ([ "<i class='fa fa-arrow-right'></i>Delete " +
                seq1[seq1_idx-1] + " (score " +
                move_score + ")", move_score + scores[seq2_idx][seq1_idx-1]]);
        }
        if (seq2_idx > 0) {
            content.push (["<i class='fa fa-arrow-down'></i>Insert " +
                seq2[seq2_idx-1] + " (score " +
                move_score + ")", move_score + scores[seq2_idx-1][seq1_idx]]);
        }

        content = _.map (content, function (d) {
            if (d[1] == scores[seq2_idx][seq1_idx]) {
                return "<b>" + d[0] + "</b>";
            }
            return d[0];
        }).join ("<br>");

        popover_obj.popover ({'content' : content, 'container' : "body", 'title' : 'Cell score calculation' , "html" : true});
        popover_obj.popover ('show');
    }

    function remove_hover () {
        var popover_obj = $(d3.select(this)[0]);
        popover_obj.popover ('destroy');
    }

    function handle_click (d, seq1_idx, seq2_idx) {

        var path = {};
        //seq2_idx --;
        seq1_idx --;
        path [seq2_idx + "," + (seq1_idx+1)] = true;

        var str1 = "", str2 = "";
        var color = [];

        while (seq2_idx > 0 || seq1_idx > 0) {
            if (seq2_idx > 0 && seq1_idx > 0) {
                var max_v = scores[seq2_idx-1][seq1_idx-1] + score_move (seq1_idx-1, seq2_idx-1,1,1);
                var move1 = 1;
                var move2 = 1;
                var try_score = scores[seq2_idx-1][seq1_idx] + score_move (seq1_idx, seq2_idx+1,0,1);

                if (try_score > max_v) {
                    max_v = try_score;
                    move1 = 0;
                }

                try_score = scores[seq2_idx][seq1_idx-1] + score_move (seq1_idx+1, seq2_idx+1,1,0);
                if (try_score > max_v) {
                    move1 = 1;
                    move2 = 0;
                }

                str2 += move2 ? seq2[seq2_idx-1] : "-";
                str1 += move1 ? seq1[seq1_idx-1] : "-";

                color.push (move1 && move2 ? (seq2[seq2_idx-1] == seq1[seq1_idx-1] ? "blue" : "red") : "black");

                seq2_idx -= move2;
                seq1_idx -= move1;
            } else {
                if (seq2_idx) {
                    seq2_idx --;
                    str1 += "-";
                    str2 += seq2[seq2_idx];
                    color.push ("black");
                } else {
                    seq1_idx --;
                    str2 += "-";
                    str1 += seq1[seq1_idx];
                    color.push ("black");
                }
            }

            path [seq2_idx + "," + (seq1_idx+1)] = true;
        }




        _.each ([[str1, "#seq1"], [str2, "#seq2"]], function (d) {
            var str = _.map (d[0], function (c) { return c;}).reverse().join ("");
            var cells = d3.select (d[1]).selectAll ("span").data (str);
            cells.enter().append ("span");
            cells.exit().remove();
            cells.transition().text (function (d, i) {return d;}).style ("color", function (d, i) {return color [color.length - 1 - i];}, true);
        });

        data_cells.style ("opacity", function (d, i, j) {
                //console.log ((i+1) + "," + (j+1));
                if (i ==0 || path[(j) + "," + (i)]) return 1;  return 0.5;
            });
        data_cells.style ("color", function (d, i, j) {
                //console.log ((i+1) + "," + (j+1));
                if (i ==0 || path[(j) + "," + (i)]) return "red";  return "grey";
            });
        //d3.select (this).style ("opacity",1);


    }

    var table = d3.select ("#" + id);
    // delete old header and footer
    table.selectAll ("thead").remove();
    table.selectAll ("tbody").remove();



    var headers = ["", "&empty;"];
     _.each (seq1, function (d) {headers.push (d);});

    var length1 = seq1.length;
    var length2 = seq2.length;

    var header_row  = table.append ("thead").selectAll ("tr").data ([headers]);
    var header_cells = header_row.enter().append ("tr").selectAll ("th").data (function (d) {return d;});
    header_cells.enter().append ("th").html (function (d) {return d;}).classed (styles["th"], true);

    var rows    = [];
    var scores  = [];
    var row = ["&empty;",0];
    var score   = [0];


    _.each (seq1, function (c) {
        score.push (score [score.length-1] - deletion);
        row.push   (score [score.length-1]);
    });
    rows.push   (row);
    scores.push (score);


    _.each (seq2, function (d,i) {
        var row   = [d];
        var score = [scores[i][0] - insertion];
        row.push (score[0]);
        _.each (seq1, function (c,j) {
            score.push (Math.max (scores[i][j+1] + score_move (j,i,0,1),
                                  score [j] + score_move (j,i,1,0),
                                  scores[i][j] + score_move (j,i,1,1)));
            row.push (score[score.length-1]);
        });
        rows.push (row);
        scores.push (score);
    });



    var data_rows  = table.append ("tbody").selectAll ("tr").data (rows);
    var data_cells = data_rows.enter().append ("tr").selectAll ("td").data (function (d) { return d;});
    data_cells.enter ().append ("td").html (function (d, i, j) {
        return i > 0 ? scores[j][i-1] : ( j > 0  ? seq2 [j-1] : "&empty;");
    }).classed (styles["td"], true)
      .style ("font-weight", function (d,i,j) { if (i == 0) {return "bold";}})
      .on ("click", handle_click)
      .on ("mouseover", handle_hover)
      .on ("mouseout", remove_hover);

    handle_click (0, seq1.length+1, seq2.length);

};
